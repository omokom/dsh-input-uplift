/**
 * Host half of the input-uplift prototype.
 *
 * A single authenticated route accepts the current draft, reads recent live
 * session text, asks the configured model for one JSON uplift result, and
 * returns it. Nothing here writes the draft or sends a message; replacement is
 * always an explicit client action.
 */
import {
  buildUpliftPrompts,
  DEFAULT_CONTEXT_BYTES,
  DEFAULT_CONTEXT_TURNS,
  selectContextMessages,
  type RawConversationMessage,
} from './host/prompt'
import {
  createMockResult,
  createUnstructuredResult,
  parseUpliftResponse,
} from './host/contract'
import { appendFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

export const name = 'input-uplift'

/** Hard Cordis activation gate: without either service the route is useless. */
export const inject = ['sessions', 'llm', 'connection']

export interface InputUpliftConfig {
  /** Local deterministic result, no model call; for UI trials without a model. */
  mock?: boolean
  provider?: string
  model?: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
  contextTurns?: number
  maxContextBytes?: number
  maxDraftBytes?: number
  includeLastAssistant?: boolean
}

interface NormalizedConfig {
  mock: boolean
  provider: string
  model: string
  temperature: number
  maxTokens: number
  timeoutMs: number
  contextTurns: number
  maxContextBytes: number
  maxDraftBytes: number
  includeLastAssistant: boolean
}

interface ModelRoute {
  provider: string
  model: string
  reasoningEffort?: string
}

interface HostSession {
  requestHeader?: () => {
    config?: { provider?: unknown; model?: unknown; reasoningEffort?: unknown }
    adapterDefaults?: { reasoningEffort?: unknown }
  } | undefined
  deriveMessages?: () => readonly RawConversationMessage[]
}

interface HostLlm {
  prepareCall?: (
    config: Record<string, unknown>,
    signal?: AbortSignal,
    configure?: (controls: Record<string, unknown>, modelInfo: unknown) => Record<string, unknown>,
  ) => Promise<{
    config: Record<string, unknown>
    stream: (options: Record<string, unknown>) => AsyncIterable<unknown>
  }>
  stream?: (options: Record<string, unknown>) => AsyncIterable<unknown>
  listProviders?: () => ReadonlyArray<{ id?: unknown; name?: unknown }>
  listModels?: (provider: string) => Promise<ReadonlyArray<{ id?: unknown; name?: unknown; description?: unknown; contextWindow?: unknown }>>
}

interface HostContext {
  sessions: { get: (sessionId: string) => HostSession | undefined }
  llm?: HostLlm
  connection?: {
    fetch: {
      register: (route: {
        path: string
        methods: string[]
        requestBody: 'buffered'
        fetch: (request: Request) => Promise<Response> | Response
      }) => () => void | void
    }
  }
  get?: (name: string) => unknown
  effect?: <T>(setup: () => T, label?: string) => T
  logger?: (name: string) => { warn: (...args: unknown[]) => void }
}

interface DshLlmModule {
  BlockAssembler?: new () => {
    push: (chunk: unknown) => void
    blocks: () => ReadonlyArray<{ type?: string; text?: string }>
    readonly finish: { kind?: string; failure?: { code?: string; message?: string } }
  }
  createUserMessage?: (input: {
    content: Array<{ type: 'text'; text: string }>
    source: { kind: 'user' }
  }) => unknown
}

class RouteFailure extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'RouteFailure'
    this.status = status
    this.code = code
  }
}

const ROUTE_PATH = '/api/input-uplift/reorganize'
const MODELS_ROUTE_PATH = '/api/input-uplift/models'
const MAX_BODY_BYTES = 64 * 1024
const MAX_EXTRA_BYTES = 4_000
const DEFAULT_TIMEOUT_MS = 20_000
const DEFAULT_MAX_TOKENS = 4_096
const DEFAULT_MAX_DRAFT_BYTES = 24_000

function clamp(value: number | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function normalizeConfig(config: InputUpliftConfig = {}): NormalizedConfig {
  const provider = typeof config.provider === 'string' ? config.provider.trim() : ''
  const model = typeof config.model === 'string' ? config.model.trim() : ''
  return {
    mock: config.mock === true,
    // A half-configured override is ignored; the session/default route wins.
    provider: provider !== '' && model !== '' ? provider : '',
    model: provider !== '' && model !== '' ? model : '',
    temperature: clamp(config.temperature, 0.3, 0, 2),
    maxTokens: Math.floor(clamp(config.maxTokens, DEFAULT_MAX_TOKENS, 512, 12_000)),
    timeoutMs: Math.floor(clamp(config.timeoutMs, DEFAULT_TIMEOUT_MS, 1_000, 120_000)),
    contextTurns: Math.floor(clamp(config.contextTurns, DEFAULT_CONTEXT_TURNS, 1, 24)),
    maxContextBytes: Math.floor(clamp(config.maxContextBytes, DEFAULT_CONTEXT_BYTES, 1_024, 64_000)),
    maxDraftBytes: Math.floor(clamp(config.maxDraftBytes, DEFAULT_MAX_DRAFT_BYTES, 1_024, MAX_BODY_BYTES)),
    includeLastAssistant: config.includeLastAssistant !== false,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function errorResponse(status: number, code: string, message: string): Response {
  return jsonResponse({ ok: false, error: { code, message } }, status)
}

function logWarning(ctx: HostContext, message: string): void {
  try {
    ctx.logger?.('input-uplift').warn(message)
  } catch {
    // Logging must never affect the route response.
  }
}

/**
 * Append one diagnostic line to `$DSH_HOME/cache/dsh-input-uplift/diag.ndjson`
 * when a model reply cannot be used. This never carries the full draft; it
 * records the route, budget, finish kind and the first few hundred characters
 * of the model output, so a model-side format problem can be diagnosed without
 * a debugger. Diagnostics never affect the response path.
 */
function writeDiagnostic(entry: Record<string, unknown>): void {
  try {
    const home = process.env.DSH_HOME ?? join(homedir(), '.dsh')
    const file = join(home, 'cache', 'dsh-input-uplift', 'diag.ndjson')
    mkdirSync(dirname(file), { recursive: true })
    appendFileSync(file, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`, 'utf8')
  } catch {
    // Diagnostics are best effort only.
  }
}

async function readRequestBody(request: Request): Promise<{
  sessionId: string
  draft: string
  options: { balanced: boolean; detailLevel: 'concise' | 'standard' | 'detailed'; provider: string; model: string }
  extra: string
}> {
  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new RouteFailure(400, 'INVALID_CONTENT_TYPE', 'Expected application/json.')
  }
  const declaredLength = Number(request.headers.get('content-length') ?? '')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new RouteFailure(400, 'REQUEST_TOO_LARGE', 'Request body exceeds 64 KiB.')
  }
  let raw: string
  try {
    raw = await request.text()
  } catch {
    throw new RouteFailure(400, 'INVALID_BODY', 'Could not read the request body.')
  }
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    throw new RouteFailure(400, 'REQUEST_TOO_LARGE', 'Request body exceeds 64 KiB.')
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new RouteFailure(400, 'INVALID_JSON', 'Request body must be valid JSON.')
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new RouteFailure(400, 'INVALID_BODY', 'Request body must be a JSON object.')
  }
  const record = parsed as Record<string, unknown>
  const sessionId = typeof record.sessionId === 'string' ? record.sessionId.trim() : ''
  const draft = typeof record.draft === 'string' ? record.draft : ''
  if (sessionId === '') throw new RouteFailure(400, 'INVALID_SESSION_ID', 'sessionId is required.')
  if (draft.trim() === '') throw new RouteFailure(400, 'INVALID_DRAFT', 'draft is required.')
  const rawOptions = typeof record.options === 'object' && record.options !== null && !Array.isArray(record.options)
    ? record.options as Record<string, unknown>
    : {}
  const options = {
    balanced: rawOptions.balanced === true,
    detailLevel: normalizeDetailLevel(rawOptions.detailLevel),
    provider: typeof rawOptions.provider === 'string' ? rawOptions.provider.trim() : '',
    model: typeof rawOptions.model === 'string' ? rawOptions.model.trim() : '',
  }
  const extra = typeof record.extra === 'string' ? record.extra.trim() : ''
  if (Buffer.byteLength(extra, 'utf8') > MAX_EXTRA_BYTES) {
    throw new RouteFailure(400, 'EXTRA_TOO_LONG', `extra exceeds ${MAX_EXTRA_BYTES} bytes.`)
  }
  return { sessionId, draft, options, extra }
}

function normalizeDetailLevel(value: unknown): 'concise' | 'standard' | 'detailed' {
  return value === 'concise' || value === 'detailed' ? value : 'standard'
}

function getSession(ctx: HostContext, sessionId: string): HostSession {
  let session: HostSession | undefined
  try {
    session = ctx.sessions.get(sessionId)
  } catch {
    session = undefined
  }
  if (session === undefined) {
    throw new RouteFailure(404, 'SESSION_NOT_LIVE', 'The session is not currently live.')
  }
  return session
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Selection order is fixed: session request header, global agent default,
 * then the plugin's paired provider/model config.
 */
function selectModel(
  ctx: HostContext,
  session: HostSession,
  config: NormalizedConfig,
  override?: { provider?: string; model?: string },
): ModelRoute | undefined {
  const overrideProvider = stringValue(override?.provider)
  const overrideModel = stringValue(override?.model)
  if (overrideProvider !== '' && overrideModel !== '') {
    return { provider: overrideProvider, model: overrideModel }
  }
  let header: ReturnType<NonNullable<HostSession['requestHeader']>> | undefined
  try {
    header = session.requestHeader?.()
  } catch {
    header = undefined
  }
  const headerConfig = header?.config
  const headerProvider = stringValue(headerConfig?.provider)
  const headerModel = stringValue(headerConfig?.model)
  if (headerProvider !== '' && headerModel !== '') {
    const route: ModelRoute = { provider: headerProvider, model: headerModel }
    const effort = stringValue(headerConfig?.reasoningEffort)
    if (effort !== '' && header?.adapterDefaults?.reasoningEffort !== true) route.reasoningEffort = effort
    return route
  }

  try {
    const defaultModel = ctx.get?.('agentDefaultModel') as {
      currentSelection?: () => { provider?: unknown; model?: unknown; reasoningEffort?: unknown } | undefined
    } | undefined
    const selection = defaultModel?.currentSelection?.()
    const provider = stringValue(selection?.provider)
    const model = stringValue(selection?.model)
    if (provider !== '' && model !== '') {
      const route: ModelRoute = { provider, model }
      const effort = stringValue(selection?.reasoningEffort)
      if (effort !== '') route.reasoningEffort = effort
      return route
    }
  } catch {
    // Optional service; ignore and try the plugin config.
  }

  if (config.provider !== '' && config.model !== '') {
    return { provider: config.provider, model: config.model }
  }
  return undefined
}

/**
 * Base call options for the helper call.
 *
 * Deliberately does NOT inherit the session's `reasoningEffort`: on the desktop
 * profile the session pins `reasoningEffort: max` (and a large maxTokens), but
 * this helper call has a comparatively small output budget. High reasoning can
 * consume that budget before any JSON text is emitted, which surfaced as an
 * empty or truncated (non-JSON) reply. A least-effort configure callback and a
 * one-shot retry with a larger budget handle that at call time (see
 * `invokeModel` / `handleReorganize`).
 */
function modelOptions(route: ModelRoute, config: NormalizedConfig): Record<string, unknown> {
  return {
    provider: route.provider,
    model: route.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  }
}

function failureCode(failure: { code?: string; message?: string } | undefined): string {
  const code = stringValue(failure?.code)
  return code !== '' ? code : 'LLM_ERROR'
}

function createConversationMessage(text: string, module: DshLlmModule): unknown {
  if (typeof module.createUserMessage === 'function') {
    try {
      return module.createUserMessage({
        content: [{ type: 'text', text }],
        source: { kind: 'user' },
      })
    } catch {
      // The runtime's constructor can reject an untyped source shape. The
      // plain message object is the documented local fallback; the LLM still
      // receives the text, which is the M1 acceptance criterion.
    }
  }
  return {
    id: `input-uplift-${Date.now()}`,
    role: 'user',
    content: [{ type: 'text', text }],
    source: { kind: 'user' },
  }
}

/**
 * Pick the model's least reasoning effort for the helper call. Models without
 * a reasoning capability expose no efforts and keep the controls unchanged.
 */
function leastReasoningEffort(
  controls: Record<string, unknown>,
  modelInfo: unknown,
): Record<string, unknown> {
  const efforts = (modelInfo as { reasoning?: { efforts?: readonly { id?: unknown }[] } } | undefined)
    ?.reasoning?.efforts
  const id = Array.isArray(efforts) ? stringValue(efforts[0]?.id) : ''
  return id === '' ? controls : { ...controls, reasoningEffort: id }
}

async function invokeModel(
  ctx: HostContext,
  config: NormalizedConfig,
  route: ModelRoute,
  system: string,
  user: string,
  signal: AbortSignal,
  timedOut: () => boolean,
): Promise<{ text: string; finishKind: string | undefined }> {
  let dshLlm: DshLlmModule | undefined
  try {
    dshLlm = await import('@deepseek-ai/dsh-llm') as unknown as DshLlmModule
  } catch {
    // Runtime resolution for an installed profile plugin may not expose the
    // dsh-llm package by bare specifier; the service object is enough, so fall
    // back to manual chunk assembly instead of failing the request.
    dshLlm = undefined
  }
  const llm = ctx.llm
  if (llm === undefined) {
    throw new RouteFailure(503, 'LLM_UNAVAILABLE', 'The llm service is unavailable.')
  }

  const messages = [createConversationMessage(user, dshLlm ?? ({} as DshLlmModule))]
  let stream: AsyncIterable<unknown>
  try {
    if (typeof llm.prepareCall === 'function') {
      const prepared = await llm.prepareCall(modelOptions(route, config), signal, leastReasoningEffort)
      if (prepared === undefined || typeof prepared.stream !== 'function') {
        throw new RouteFailure(503, 'LLM_UNAVAILABLE', 'The prepared LLM call is invalid.')
      }
      stream = prepared.stream({
        ...prepared.config,
        messages,
        system,
        signal,
      })
    } else if (typeof llm.stream === 'function') {
      stream = llm.stream({
        ...modelOptions(route, config),
        messages,
        system,
        signal,
      })
    } else {
      throw new RouteFailure(503, 'LLM_UNAVAILABLE', 'The llm service exposes neither prepareCall nor stream.')
    }
  } catch (error) {
    if (error instanceof RouteFailure) throw error
    if (signal.aborted) {
      throw new RouteFailure(502, timedOut() ? 'LLM_TIMEOUT' : 'LLM_ABORTED', 'The model request was aborted.')
    }
    const code = failureCode(error as { code?: string; message?: string })
    throw new RouteFailure(502, code, `The model request failed (${code}).`)
  }

  let text = ''
  let finish: { kind?: string; failure?: { code?: string; message?: string } } | undefined
  try {
    if (dshLlm !== undefined && typeof dshLlm.BlockAssembler === 'function') {
      const assembler = new dshLlm.BlockAssembler()
      for await (const chunk of stream) assembler.push(chunk)
      finish = assembler.finish
      text = assembler.blocks()
        .filter(block => block.type === 'text' && typeof block.text === 'string')
        .map(block => block.text ?? '')
        .join('')
    } else {
      // Defensive fallback for a runtime whose assembler export moved.
      for await (const rawChunk of stream) {
        if (typeof rawChunk !== 'object' || rawChunk === null) continue
        const chunk = rawChunk as {
          type?: string
          text?: string
          reason?: { kind?: string; failure?: { code?: string; message?: string } }
        }
        if (chunk.type === 'text-delta' && typeof chunk.text === 'string') text += chunk.text
        if (chunk.type === 'finish') finish = chunk.reason
      }
    }
  } catch (error) {
    if (signal.aborted) {
      throw new RouteFailure(502, timedOut() ? 'LLM_TIMEOUT' : 'LLM_ABORTED', 'The model request was aborted.')
    }
    const code = failureCode(error as { code?: string; message?: string })
    throw new RouteFailure(502, code, `The model request failed (${code}).`)
  }

  if (timedOut()) {
    throw new RouteFailure(502, 'LLM_TIMEOUT', 'The model request timed out.')
  }
  if (finish?.kind === 'error' || finish?.kind === 'aborted') {
    const code = failureCode(finish.failure)
    throw new RouteFailure(502, code, `The model request ended with ${finish.kind} (${code}).`)
  }
  return { text, finishKind: finish?.kind }
}

async function handleReorganize(
  ctx: HostContext,
  config: NormalizedConfig,
  request: Request,
): Promise<Response> {
  try {
    const { sessionId, draft, options, extra } = await readRequestBody(request)
    if (Buffer.byteLength(draft, 'utf8') > config.maxDraftBytes) {
      throw new RouteFailure(400, 'DRAFT_TOO_LONG', `Draft exceeds ${config.maxDraftBytes} bytes.`)
    }
    const session = getSession(ctx, sessionId)

    if (config.mock) {
      return jsonResponse({ ok: true, result: createMockResult(draft) })
    }

    let rawMessages: readonly RawConversationMessage[] = []
    try {
      if (typeof session.deriveMessages !== 'function') {
        throw new Error('deriveMessages is unavailable')
      }
      rawMessages = session.deriveMessages()
    } catch {
      throw new RouteFailure(502, 'CONTEXT_UNAVAILABLE', 'Could not derive session messages.')
    }

    const route = selectModel(ctx, session, config, { provider: options.provider, model: options.model })
    if (route === undefined) {
      throw new RouteFailure(503, 'NO_MODEL', 'No provider/model is configured for this session.')
    }

    const context = selectContextMessages(rawMessages, {
      contextTurns: config.contextTurns,
      maxContextBytes: config.maxContextBytes,
      includeLastAssistant: config.includeLastAssistant,
    })
    const prompts = buildUpliftPrompts({
      draft,
      context,
      options: { balanced: options.balanced, detailLevel: options.detailLevel },
      extra,
    })

    const controller = new AbortController()
    let didTimeOut = false
    const onRequestAbort = (): void => controller.abort()
    if (request.signal.aborted) controller.abort()
    else request.signal.addEventListener('abort', onRequestAbort, { once: true })
    const timer = setTimeout(() => {
      didTimeOut = true
      controller.abort()
    }, config.timeoutMs)

    let text = ''
    let finishKind: string | undefined
    try {
      // A "detailed" result needs more room; one retry with a larger budget
      // also covers a reasoning model that consumed its output budget before
      // emitting JSON (visible as an empty or truncated, non-JSON reply).
      const baseMaxTokens = options.detailLevel === 'detailed'
        ? Math.min(Math.max(config.maxTokens, 6_144), 12_000)
        : config.maxTokens
      const budgets = [baseMaxTokens, Math.min(baseMaxTokens * 2, 12_000)]
      for (let attempt = 0; attempt < budgets.length; attempt += 1) {
        const attemptConfig = attempt === 0 ? config : { ...config, maxTokens: budgets[attempt] }
        const outcome = await invokeModel(
          ctx,
          attemptConfig,
          route,
          prompts.system,
          prompts.user,
          controller.signal,
          () => didTimeOut,
        )
        text = outcome.text
        finishKind = outcome.finishKind
        const parsed = parseUpliftResponse(text)
        if (parsed.ok) {
          return jsonResponse({ ok: true, result: parsed.result })
        }
        writeDiagnostic({
          event: 'parse-failed',
          attempt,
          provider: route.provider,
          model: route.model,
          maxTokens: attemptConfig.maxTokens,
          finishKind,
          textLength: text.length,
          textHead: text.slice(0, 500),
        })
      }
    } finally {
      clearTimeout(timer)
      request.signal.removeEventListener('abort', onRequestAbort)
    }

    const fallback = text.trim()
    if (fallback === '') {
      writeDiagnostic({ event: 'empty-response', provider: route.provider, model: route.model, finishKind })
      throw new RouteFailure(
        502,
        'EMPTY_RESPONSE',
        'The model returned no text after a retry with a larger budget; high reasoning effort may be consuming the output budget.',
      )
    }
    writeDiagnostic({ event: 'unstructured', provider: route.provider, model: route.model, finishKind, textLength: fallback.length, textHead: fallback.slice(0, 800) })
    return jsonResponse({ ok: true, result: createUnstructuredResult(fallback) })
  } catch (error) {
    if (error instanceof RouteFailure) {
      return errorResponse(error.status, error.code, error.message)
    }
    const code = failureCode(error as { code?: string; message?: string })
    logWarning(ctx, `reorganize failed: ${code}`)
    return errorResponse(502, code, `The uplift request failed (${code}).`)
  }
}

/**
 * Enumerate registered providers and their advertised models so the card's
 * settings panel can offer an explicit model choice. Catalog membership is
 * advisory for request routing; a provider without a catalog still appears
 * with an empty model list.
 */
async function handleModels(ctx: HostContext): Promise<Response> {
  const llm = ctx.llm
  if (llm === undefined || typeof llm.listProviders !== 'function') {
    return errorResponse(503, 'LLM_UNAVAILABLE', 'The llm service is unavailable.')
  }
  let providersRaw: ReadonlyArray<{ id?: unknown; name?: unknown }> = []
  try {
    providersRaw = llm.listProviders()
  } catch {
    providersRaw = []
  }
  const providers: Array<{
    id: string
    name: string
    models: Array<{ id: string; name: string; contextWindow?: number }>
  }> = []
  for (const item of providersRaw) {
    const id = stringValue(item.id)
    if (id === '') continue
    const entry: (typeof providers)[number] = { id, name: stringValue(item.name) || id, models: [] }
    try {
      const models = typeof llm.listModels === 'function' ? await llm.listModels(id) : []
      for (const model of models) {
        const modelId = stringValue(model.id)
        if (modelId === '') continue
        entry.models.push({
          id: modelId,
          name: stringValue(model.name) || modelId,
          ...(typeof model.contextWindow === 'number' ? { contextWindow: model.contextWindow } : {}),
        })
      }
    } catch {
      // A provider whose discovery failed still appears with no models.
    }
    providers.push(entry)
  }
  return jsonResponse({ ok: true, providers })
}

/**
 * Register the authenticated routes. Client-side no-op until the user clicks
 * the trigger; no draft is read or written by the host.
 */
export function apply(ctx: HostContext, rawConfig: InputUpliftConfig = {}): void {
  const config = normalizeConfig(rawConfig)
  const connection = ctx.connection
  if (connection === undefined) {
    logWarning(ctx, 'connection service unavailable; route not registered')
    return
  }
  const register = (): Array<void | (() => void)> => [
    connection.fetch.register({
      path: ROUTE_PATH,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: request => handleReorganize(ctx, config, request),
    }),
    connection.fetch.register({
      path: MODELS_ROUTE_PATH,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: () => handleModels(ctx),
    }),
  ]
  if (typeof ctx.effect === 'function') {
    ctx.effect(register, 'input-uplift: reorganize and models routes')
  } else {
    register()
  }
}
