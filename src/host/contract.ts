/**
 * Strict-ish parser and normalizer for the model's single JSON object.
 *
 * The parser tolerates prose, Markdown fences, and a JSON object embedded in
 * surrounding text. Field values are normalized defensively; alignment items
 * without a non-empty `evidence.quote` are discarded to reduce hallucinated
 * findings. Pure module, no Node or DSH imports.
 */

export const UPLIFT_KINDS = [
  'new_goal',
  'continue',
  'choose_confirm',
  'scope_change',
  'challenge',
  'question',
] as const

export type UpliftKind = typeof UPLIFT_KINDS[number]

export const ALIGNMENT_TYPES = [
  'conflict',
  'duplicate',
  'overrides_confirmed',
  'stale_assumption',
] as const

export type AlignmentType = typeof ALIGNMENT_TYPES[number]
export type AlignmentSeverity = 'high' | 'medium' | 'low'

export interface AlignmentItem {
  type: AlignmentType
  severity: AlignmentSeverity
  claim: string
  evidence: { from: string; quote: string }
  suggestion: string
  applied_in_rewrite: boolean
  /**
   * A ready-to-append first-person sentence that implements the suggested fix.
   * The card appends it to the rewrite when the user adopts the finding, so
   * adoption has a visible effect on the text without another model call.
   */
  adoption_text: string
}

export interface TaskItem {
  text: string
  source: 'draft' | 'context'
}

export interface ConstraintItem {
  text: string
  source: 'draft' | 'context'
  applied_in_rewrite: boolean
}

export interface Brief {
  /** What the user is really trying to move forward. */
  purpose: string
  /** Which project parts / modules / assets this message actually covers. */
  scope: string
  /** How the key constraint should be applied (e.g. how an art direction maps onto the scope). */
  approach: string
  /** Acceptance or success signal. */
  acceptance: string
  /** Task chain / system relationship. */
  chain: string
}

export interface AssumptionItem {
  text: string
  consequence: string
  reversible: boolean
}

export interface UpliftResult {
  kind: UpliftKind
  rewrite: string
  rewrite_override?: string
  alignment: AlignmentItem[]
  task: TaskItem
  constraints: ConstraintItem[]
  signals: string[]
  brief: Brief
  assumptions: AssumptionItem[]
  unknowns: string[]
  inferred_in_rewrite: string[]
  no_uplift: boolean
  reason: string
  /** Set only when the host had to preserve a non-JSON plain-text response. */
  unstructured?: boolean
  /** Set only by the deterministic local mock path. */
  mock?: boolean
}

export type ParseOutcome =
  | { ok: true; result: UpliftResult; warnings: string[] }
  | { ok: false; warnings: string[] }

const MAX_ALIGNMENT = 8
const MAX_CONSTRAINTS = 12
const MAX_SIGNALS = 10
const MAX_ASSUMPTIONS = 6
const MAX_UNKNOWNS = 10
const MAX_INFERRED = 6
const MAX_REWRITE_CHARS = 32_000
const MAX_FIELD_CHARS = 2_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanText(value: unknown, max = MAX_FIELD_CHARS): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asSource(value: unknown): 'draft' | 'context' {
  return value === 'context' ? 'context' : 'draft'
}

function asKind(value: unknown): UpliftKind | undefined {
  return typeof value === 'string' && (UPLIFT_KINDS as readonly string[]).includes(value)
    ? value as UpliftKind
    : undefined
}

function asAlignmentType(value: unknown): AlignmentType | undefined {
  return typeof value === 'string' && (ALIGNMENT_TYPES as readonly string[]).includes(value)
    ? value as AlignmentType
    : undefined
}

function asSeverity(value: unknown): AlignmentSeverity {
  return value === 'high' || value === 'medium' || value === 'low' ? value : 'medium'
}

function stringList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of value) {
    const text = cleanText(item)
    if (text === '' || seen.has(text)) continue
    seen.add(text)
    out.push(text)
    if (out.length >= maxItems) break
  }
  return out
}

function normalizeAlignment(value: unknown, warnings: string[]): AlignmentItem[] {
  if (!Array.isArray(value)) {
    if (value !== undefined) warnings.push('alignment was not an array')
    return []
  }
  const out: AlignmentItem[] = []
  let droppedWithoutEvidence = 0
  for (const item of value) {
    if (!isRecord(item)) continue
    const type = asAlignmentType(item.type)
    if (type === undefined) continue
    const evidence = isRecord(item.evidence) ? item.evidence : undefined
    const quote = cleanText(evidence?.quote)
    if (quote === '') {
      droppedWithoutEvidence += 1
      continue
    }
    const claim = cleanText(item.claim) || cleanText(item.suggestion) || '(no description)'
    out.push({
      type,
      severity: asSeverity(item.severity),
      claim,
      evidence: {
        from: cleanText(evidence?.from) || 'context',
        quote,
      },
      suggestion: cleanText(item.suggestion),
      applied_in_rewrite: asBoolean(item.applied_in_rewrite, false),
      adoption_text: cleanText(item.adoption_text),
    })
    if (out.length >= MAX_ALIGNMENT) break
  }
  if (droppedWithoutEvidence > 0) {
    warnings.push(`dropped ${droppedWithoutEvidence} alignment item(s) without evidence.quote`)
  }
  return out
}

function normalizeTask(value: unknown): TaskItem {
  if (typeof value === 'string') return { text: cleanText(value), source: 'draft' }
  if (!isRecord(value)) return { text: '', source: 'draft' }
  return { text: cleanText(value.text), source: asSource(value.source) }
}

function normalizeConstraints(value: unknown): ConstraintItem[] {
  if (!Array.isArray(value)) return []
  const out: ConstraintItem[] = []
  for (const item of value) {
    if (typeof item === 'string') {
      const text = cleanText(item)
      if (text !== '') out.push({ text, source: 'draft', applied_in_rewrite: false })
    } else if (isRecord(item)) {
      const text = cleanText(item.text)
      if (text === '') continue
      out.push({
        text,
        source: asSource(item.source),
        applied_in_rewrite: asBoolean(item.applied_in_rewrite, false),
      })
    }
    if (out.length >= MAX_CONSTRAINTS) break
  }
  return out
}

function normalizeBrief(value: unknown): Brief {
  if (!isRecord(value)) return { purpose: '', scope: '', approach: '', acceptance: '', chain: '' }
  return {
    purpose: cleanText(value.purpose),
    scope: cleanText(value.scope),
    approach: cleanText(value.approach),
    acceptance: cleanText(value.acceptance),
    chain: cleanText(value.chain),
  }
}

function normalizeAssumptions(value: unknown): AssumptionItem[] {
  if (!Array.isArray(value)) return []
  const out: AssumptionItem[] = []
  for (const item of value) {
    if (typeof item === 'string') {
      const text = cleanText(item)
      if (text !== '') out.push({ text, consequence: '', reversible: true })
    } else if (isRecord(item)) {
      const text = cleanText(item.text)
      if (text === '') continue
      out.push({
        text,
        consequence: cleanText(item.consequence),
        reversible: asBoolean(item.reversible, true),
      })
    }
    if (out.length >= MAX_ASSUMPTIONS) break
  }
  return out
}

function normalizeResultObject(value: Record<string, unknown>, warnings: string[]): UpliftResult | undefined {
  const recognizedKeys = [
    'kind', 'rewrite', 'rewrite_override', 'alignment', 'task', 'constraints',
    'signals', 'brief', 'assumptions', 'unknowns', 'inferred_in_rewrite',
    'no_uplift', 'reason',
  ]
  if (!recognizedKeys.some(key => Object.prototype.hasOwnProperty.call(value, key))) return undefined

  const kind = asKind(value.kind)
  if (kind === undefined && value.kind !== undefined) warnings.push('unknown kind; fell back to question')

  const result: UpliftResult = {
    kind: kind ?? 'question',
    rewrite: cleanText(value.rewrite, MAX_REWRITE_CHARS),
    alignment: normalizeAlignment(value.alignment, warnings),
    task: normalizeTask(value.task),
    constraints: normalizeConstraints(value.constraints),
    signals: stringList(value.signals, MAX_SIGNALS),
    brief: normalizeBrief(value.brief),
    assumptions: normalizeAssumptions(value.assumptions),
    unknowns: stringList(value.unknowns, MAX_UNKNOWNS),
    inferred_in_rewrite: stringList(value.inferred_in_rewrite, MAX_INFERRED),
    no_uplift: asBoolean(value.no_uplift, false),
    reason: cleanText(value.reason, 4_000),
  }
  const override = cleanText(value.rewrite_override, MAX_REWRITE_CHARS)
  if (override !== '') result.rewrite_override = override
  return result
}

function tryParseObject(candidate: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(candidate)
    return isRecord(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

/** Extract balanced JSON object substrings, respecting strings and escapes. */
function balancedObjects(text: string): string[] {
  const objects: string[] = []
  for (let start = 0; start < text.length; start += 1) {
    if (text[start] !== '{') continue
    let depth = 0
    let inString = false
    let escaped = false
    for (let index = start; index < text.length; index += 1) {
      const char = text[index]
      if (inString) {
        if (escaped) escaped = false
        else if (char === '\\') escaped = true
        else if (char === '"') inString = false
        continue
      }
      if (char === '"') {
        inString = true
        continue
      }
      if (char === '{') depth += 1
      else if (char === '}') {
        depth -= 1
        if (depth === 0) {
          objects.push(text.slice(start, index + 1))
          break
        }
      }
    }
    if (objects.length >= 20) break
  }
  return objects
}

/**
 * Parse the assistant text. Accepted shapes, in order:
 *   1. a bare JSON object;
 *   2. one or more Markdown code-fenced blocks (json tag optional);
 *   3. the first balanced JSON object inside surrounding prose.
 */
export function parseUpliftResponse(raw: string): ParseOutcome {
  const warnings: string[] = []
  const text = raw.replace(/^\uFEFF/, '').trim()
  if (text === '') return { ok: false, warnings: ['empty model response'] }

  const candidates: string[] = [text]
  const fence = /```(?:json)?\s*([\s\S]*?)```/gi
  for (let match = fence.exec(text); match !== null; match = fence.exec(text)) {
    const body = match[1]?.trim()
    if (body !== undefined && body !== '') candidates.push(body)
  }
  candidates.push(...balancedObjects(text))

  const seen = new Set<string>()
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue
    seen.add(candidate)
    const object = tryParseObject(candidate)
    if (object === undefined) continue
    const result = normalizeResultObject(object, warnings)
    if (result === undefined) {
      warnings.push('parsed JSON did not contain any uplift fields')
      continue
    }
    return { ok: true, result, warnings }
  }
  return { ok: false, warnings: [...warnings, 'no parseable JSON object found'] }
}

/**
 * Last-resort degradation: keep non-JSON plain text as a user-confirmed
 * rewrite. The client marks this result as unstructured. JSON-looking garbage
 * is intentionally not turned into a draft replacement.
 */
export function createUnstructuredResult(raw: string): UpliftResult {
  return {
    kind: 'question',
    rewrite: cleanText(raw, MAX_REWRITE_CHARS),
    alignment: [],
    task: { text: '', source: 'draft' },
    constraints: [],
    signals: [],
    brief: { purpose: '', scope: '', approach: '', acceptance: '', chain: '' },
    assumptions: [],
    unknowns: [],
    inferred_in_rewrite: [],
    no_uplift: false,
    reason: 'The model returned unstructured text. Review it carefully before replacing.',
    unstructured: true,
  }
}

function mockKindFor(draft: string): UpliftKind {
  const text = draft.trim()
  if (/^(继续|接着|continue\b)/i.test(text)) return 'continue'
  if (/[?？]\s*$/.test(text)) return 'question'
  if (/(不对|为什么|why\b|wrong\b)/i.test(text)) return 'challenge'
  if (/^(就按|可以|确认|ok\b|yes\b)/i.test(text)) return 'choose_confirm'
  return 'new_goal'
}

/**
 * Deterministic local mock for hosts without a usable model. It intentionally
 * has no alignment/task/constraint claims; it only gives the UI a realistic
 * rewrite payload and visibly labels itself as a mock.
 */
export function createMockResult(draft: string): UpliftResult {
  const paragraphs = draft
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== '')
  const base = paragraphs.length > 0 ? paragraphs.join('\n\n') : draft.trim()
  const rewrite = `${base}${base.endsWith('（mock）') || base.endsWith('(mock)') ? '' : '\n\n（mock）'}`
  return {
    kind: mockKindFor(draft),
    rewrite,
    alignment: [],
    task: { text: '', source: 'draft' },
    constraints: [],
    signals: [],
    brief: { purpose: '', scope: '', approach: '', acceptance: '', chain: '' },
    assumptions: [],
    unknowns: ['Mock mode: no model call was made.'],
    inferred_in_rewrite: [],
    no_uplift: false,
    reason: 'mock',
    mock: true,
  }
}
