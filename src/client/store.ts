/**
 * Per-session in-memory card state. Nothing here writes the composer.
 * `requestId` + session identity fence every late/aborted response.
 */
import { useSyncExternalStore } from 'react'
import type { UpliftResult } from '../host/contract'
import { isComposingNow } from './composition'

export { composeFinalText } from '../host/compose'

export type SessionStatus = 'idle' | 'generating' | 'ready' | 'error' | 'replaced'
export type ReplaceMode = 'insert' | 'setDraft'

export type DetailLevel = 'concise' | 'standard' | 'detailed'
export type DisplayMode = 'overlay' | 'side'

export interface UpliftOptions {
  /** Ask for a balanced result: competing options/readings with trade-offs. */
  balanced: boolean
  /** How much detail the generated rewrite should carry. */
  detailLevel: DetailLevel
  /** Auto-uplift after the draft has been idle for this many seconds (0 = off). */
  autoDelaySeconds: number
  /** Explicit provider override; empty follows the session route. */
  provider: string
  /** Explicit model override; empty follows the session route. */
  model: string
  /** Floating card above the composer, or a drawer docked to the right side. */
  displayMode: DisplayMode
}

export const DEFAULT_OPTIONS: UpliftOptions = {
  balanced: false,
  detailLevel: 'standard',
  autoDelaySeconds: 0,
  provider: '',
  model: '',
  displayMode: 'overlay',
}

/** Preferred result options survive closing the card, per session. */
const preferredOptions = new Map<string, UpliftOptions>()
const preferredListeners = new Set<() => void>()
const PREFERRED_STORAGE_KEY = 'dsh-input-uplift:preferred'
let storedOptions: UpliftOptions | null = null

function readStoredOptions(): UpliftOptions {
  if (storedOptions !== null) return storedOptions
  storedOptions = DEFAULT_OPTIONS
  try {
    const raw = window.localStorage.getItem(PREFERRED_STORAGE_KEY)
    if (raw !== null) {
      const value = JSON.parse(raw) as Partial<UpliftOptions>
      storedOptions = {
        balanced: value.balanced === true,
        detailLevel: value.detailLevel === 'concise' || value.detailLevel === 'detailed' ? value.detailLevel : 'standard',
        autoDelaySeconds: typeof value.autoDelaySeconds === 'number' && Number.isFinite(value.autoDelaySeconds)
          ? Math.min(120, Math.max(0, Math.floor(value.autoDelaySeconds)))
          : 0,
        provider: typeof value.provider === 'string' ? value.provider : '',
        model: typeof value.model === 'string' ? value.model : '',
        displayMode: value.displayMode === 'side' ? 'side' : 'overlay',
      }
    }
  } catch {
    storedOptions = DEFAULT_OPTIONS
  }
  return storedOptions
}

function sameOptions(left: UpliftOptions, right: UpliftOptions): boolean {
  return left.balanced === right.balanced
    && left.detailLevel === right.detailLevel
    && left.autoDelaySeconds === right.autoDelaySeconds
    && left.provider === right.provider
    && left.model === right.model
    && left.displayMode === right.displayMode
}

function notifyPreferred(): void {
  for (const listener of [...preferredListeners]) listener()
}

export function getPreferredOptions(sessionId: string): UpliftOptions {
  return preferredOptions.get(sessionId) ?? readStoredOptions()
}

export function setPreferredOptions(sessionId: string, next: UpliftOptions): void {
  const previous = preferredOptions.get(sessionId) ?? readStoredOptions()
  if (sameOptions(previous, next)) return
  preferredOptions.set(sessionId, next)
  storedOptions = next
  try {
    window.localStorage.setItem(PREFERRED_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Quota/private mode: keep the in-memory preference only.
  }
  notifyPreferred()
}

/** Reactive read of the preferred options (used by the auto-uplift timer). */
export function usePreferredOptions(sessionId: string): UpliftOptions {
  return useSyncExternalStore(
    listener => {
      preferredListeners.add(listener)
      return () => preferredListeners.delete(listener)
    },
    () => getPreferredOptions(sessionId),
    () => getPreferredOptions(sessionId),
  )
}

export interface SessionError {
  code: string
  message: string
}

export interface ChipSelection {
  task: boolean
  constraints: boolean[]
  signals: boolean[]
}

export interface SessionState {
  status: SessionStatus
  requestId: number
  genDraft: string
  genDraftRev: number
  originalDraft: string
  result: UpliftResult | null
  error: SessionError | null
  replaceError: SessionError | null
  ignored: number[]
  adopted: number[]
  selectedChips: ChipSelection
  appliedText: string
  replaceMode: ReplaceMode | null
  options: UpliftOptions
  /** Free text the user types to supplement the generated result. */
  supplement: string
  /** Base rewrite captured when the supplement was appended (for undo). */
  supplementBase: string
  supplementApplied: boolean
  /** Alignment findings checked for a batch adoption (indices into result.alignment). */
  adoptionSelection: number[]
  /** Rewrite text before any alignment adoption was applied (for undo all). */
  adoptionBase: string
  /** Sentences appended to the rewrite by adopted alignment findings. */
  adoptedTexts: string[]
}

const EMPTY_STATE: SessionState = {
  status: 'idle',
  requestId: 0,
  genDraft: '',
  genDraftRev: -1,
  originalDraft: '',
  result: null,
  error: null,
  replaceError: null,
  ignored: [],
  adopted: [],
  selectedChips: { task: false, constraints: [], signals: [] },
  appliedText: '',
  replaceMode: null,
  options: DEFAULT_OPTIONS,
  supplement: '',
  supplementBase: '',
  supplementApplied: false,
  adoptionSelection: [],
  adoptionBase: '',
  adoptedTexts: [],
}

const states = new Map<string, SessionState>()
const controllers = new Map<string, AbortController>()
const storeListeners = new Set<() => void>()
let nextRequestId = 1

function notify(): void {
  for (const listener of [...storeListeners]) listener()
}

function subscribeStore(listener: () => void): () => void {
  storeListeners.add(listener)
  return () => storeListeners.delete(listener)
}

export function getSessionState(sessionId: string): SessionState {
  return states.get(sessionId) ?? EMPTY_STATE
}

export function useSessionState(sessionId: string): SessionState {
  return useSyncExternalStore(
    subscribeStore,
    () => getSessionState(sessionId),
    () => getSessionState(sessionId),
  )
}

function update(sessionId: string, updater: (state: SessionState) => SessionState): void {
  const previous = states.get(sessionId)
  if (previous === undefined) return
  const next = updater(previous)
  if (next === previous) return
  states.set(sessionId, next)
  notify()
}

function abortController(sessionId: string): void {
  const controller = controllers.get(sessionId)
  if (controller !== undefined) {
    controllers.delete(sessionId)
    controller.abort()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readErrorResponse(body: unknown, status: number): SessionError {
  if (isRecord(body) && isRecord(body.error)) {
    const code = typeof body.error.code === 'string' && body.error.code !== '' ? body.error.code : `HTTP_${status}`
    const message = typeof body.error.message === 'string' ? body.error.message : ''
    return { code, message }
  }
  return { code: status > 0 ? `HTTP_${status}` : 'UNKNOWN', message: '' }
}

function isPlausibleResult(value: unknown): value is UpliftResult {
  if (!isRecord(value)) return false
  return typeof value.rewrite === 'string'
    && Array.isArray(value.alignment)
    && typeof value.no_uplift === 'boolean'
}

function defaultChipSelection(result: UpliftResult): ChipSelection {
  // Chips are opt-in: replacing the composer must use the rewrite as-is unless
  // the user explicitly checks an extracted task/constraint/signal. This keeps
  // the sent message from gaining template lines such as “本次任务：…”.
  return {
    task: false,
    constraints: Array.isArray(result.constraints) ? result.constraints.map(() => false) : [],
    signals: Array.isArray(result.signals) ? result.signals.map(() => false) : [],
  }
}

function fail(sessionId: string, requestId: number, error: SessionError): void {
  const current = states.get(sessionId)
  if (current === undefined || current.requestId !== requestId) return
  states.set(sessionId, {
    ...current,
    status: 'error',
    result: null,
    error,
    replaceError: null,
  })
  notify()
}

/**
 * Start one request. Re-triggering aborts the previous one. The input snapshot
 * is captured by the caller; this function never reads/modifies the composer.
 * `options` are the result-shape switches (balanced/detailed); `extra` is the
 * user's supplement to integrate on a regenerate; `fresh` starts a new card
 * (clears a previously appended supplement).
 */
export function beginGeneration(
  sessionId: string,
  draft: string,
  draftRev: number,
  options: UpliftOptions = getPreferredOptions(sessionId),
  extra: string = '',
  fresh = false,
): boolean {
  if (sessionId === '' || draft.trim() === '' || isComposingNow()) return false
  abortController(sessionId)
  setPreferredOptions(sessionId, options)
  const requestId = nextRequestId
  nextRequestId += 1
  const controller = new AbortController()
  controllers.set(sessionId, controller)
  const previous = states.get(sessionId)
  states.set(sessionId, {
    status: 'generating',
    requestId,
    genDraft: draft,
    genDraftRev: draftRev,
    originalDraft: draft,
    result: null,
    error: null,
    replaceError: null,
    ignored: [],
    adopted: [],
    selectedChips: { task: false, constraints: [], signals: [] },
    appliedText: '',
    replaceMode: null,
    options,
    supplement: fresh ? '' : previous?.supplement ?? '',
    supplementBase: '',
    supplementApplied: false,
    adoptionSelection: [],
    adoptionBase: '',
    adoptedTexts: [],
  })
  notify()

  void (async () => {
    try {
      const trimmedExtra = extra.trim()
      const response = await fetch('/api/input-uplift/reorganize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          draft,
          options: {
            balanced: options.balanced,
            detailLevel: options.detailLevel,
            ...(options.provider === '' || options.model === ''
              ? {}
              : { provider: options.provider, model: options.model }),
          },
          ...(trimmedExtra === '' ? {} : { extra: trimmedExtra }),
        }),
        signal: controller.signal,
      })
      let body: unknown = null
      try {
        body = await response.json()
      } catch {
        body = null
      }
      if (controller.signal.aborted) return
      const current = states.get(sessionId)
      if (current === undefined || current.requestId !== requestId) return
      if (!response.ok || !isRecord(body) || body.ok !== true) {
        fail(sessionId, requestId, readErrorResponse(body, response.status))
        return
      }
      if (!isPlausibleResult(body.result)) {
        fail(sessionId, requestId, { code: 'BAD_RESPONSE', message: 'Malformed result from host.' })
        return
      }
      update(sessionId, state => state.requestId === requestId
        ? {
            ...state,
            status: 'ready',
            result: body.result as UpliftResult,
            selectedChips: defaultChipSelection(body.result as UpliftResult),
            error: null,
            replaceError: null,
          }
        : state)
    } catch (error) {
      if (controller.signal.aborted) return
      const message = error instanceof Error ? error.message : ''
      fail(sessionId, requestId, { code: 'NETWORK', message })
    } finally {
      if (controllers.get(sessionId) === controller) controllers.delete(sessionId)
    }
  })()

  return true
}

export function closeSession(sessionId: string): void {
  abortController(sessionId)
  if (states.delete(sessionId)) notify()
}

export function disposeSession(sessionId: string): void {
  closeSession(sessionId)
}

export function setReplaceError(sessionId: string, code: string, message: string): void {
  update(sessionId, state => ({ ...state, replaceError: { code, message } }))
}

export function clearReplaceError(sessionId: string): void {
  update(sessionId, state => state.replaceError === null ? state : { ...state, replaceError: null })
}

export function markReplaced(sessionId: string, appliedText: string, mode: ReplaceMode): void {
  update(sessionId, state => ({
    ...state,
    status: 'replaced',
    appliedText,
    replaceMode: mode,
    replaceError: null,
  }))
}

/** Toggle the result-shape switches; they apply on the next generation. */
export function setOptions(sessionId: string, patch: Partial<UpliftOptions>): void {
  update(sessionId, state => {
    const options: UpliftOptions = { ...state.options, ...patch }
    setPreferredOptions(sessionId, options)
    return { ...state, options }
  })
}

/** Edit the free-text supplement (does not touch the result until applied). */
export function setSupplement(sessionId: string, text: string): void {
  update(sessionId, state => (state.supplement === text ? state : { ...state, supplement: text }))
}

/** Append the supplement to the generated rewrite (client-side, no model call). */
export function applySupplement(sessionId: string): void {
  update(sessionId, state => {
    const extra = state.supplement.trim()
    if (state.result === null || extra === '' || state.supplementApplied) return state
    const base = state.result.rewrite
    return {
      ...state,
      result: { ...state.result, rewrite: `${base.trimEnd()}\n\n${extra}` },
      supplementBase: base,
      supplementApplied: true,
    }
  })
}

export function undoSupplement(sessionId: string): void {
  update(sessionId, state => {
    if (state.result === null || !state.supplementApplied) return state
    return {
      ...state,
      result: { ...state.result, rewrite: state.supplementBase },
      supplementBase: '',
      supplementApplied: false,
    }
  })
}

/** The sentence a finding contributes to the rewrite when adopted. */
function adoptionSentence(result: UpliftResult | null, index: number): string {
  if (result === null) return ''
  const item = result.alignment[index]
  if (item === undefined) return ''
  return (item.adoption_text !== '' ? item.adoption_text : item.suggestion !== '' ? item.suggestion : item.claim).trim()
}

function adoptIntoState(state: SessionState, indices: number[]): SessionState {
  if (state.result === null) return state
  const usable = indices.filter(index => !state.adopted.includes(index) && !state.ignored.includes(index))
  if (usable.length === 0) return state
  const base = state.adoptionBase !== '' ? state.adoptionBase : state.result.rewrite
  const adoptedTexts = [...state.adoptedTexts]
  for (const index of usable) {
    const sentence = adoptionSentence(state.result, index)
    if (sentence === '' || adoptedTexts.includes(sentence)) continue
    adoptedTexts.push(sentence)
  }
  if (adoptedTexts.length === state.adoptedTexts.length) return state
  return {
    ...state,
    result: { ...state.result, rewrite: [base.trimEnd(), ...adoptedTexts].join('\n\n') },
    adoptionBase: base,
    adoptedTexts,
    adopted: [...state.adopted, ...usable],
    adoptionSelection: state.adoptionSelection.filter(index => !usable.includes(index)),
  }
}

/** Check/uncheck a finding for a later batch adoption. */
export function toggleAlignmentSelection(sessionId: string, index: number): void {
  update(sessionId, state => {
    if (state.result === null || state.adopted.includes(index) || state.ignored.includes(index)) return state
    const selected = state.adoptionSelection.includes(index)
    return {
      ...state,
      adoptionSelection: selected
        ? state.adoptionSelection.filter(item => item !== index)
        : [...state.adoptionSelection, index],
    }
  })
}

/** Adopt one finding immediately: its adoption sentence is appended to rewrite. */
export function adoptAlignment(sessionId: string, index: number): void {
  update(sessionId, state => adoptIntoState(state, [index]))
}

/** Adopt every checked finding in one step. */
export function adoptSelectedAlignments(sessionId: string): void {
  update(sessionId, state => adoptIntoState(state, state.adoptionSelection))
}

/** Undo every adoption: restore the rewrite captured before the first one. */
export function undoAdoptions(sessionId: string): void {
  update(sessionId, state => {
    if (state.result === null || state.adopted.length === 0) return state
    return {
      ...state,
      result: {
        ...state.result,
        rewrite: state.adoptionBase !== '' ? state.adoptionBase : state.result.rewrite,
      },
      adopted: [],
      adoptedTexts: [],
      adoptionBase: '',
      adoptionSelection: [],
    }
  })
}

export function ignoreAlignment(sessionId: string, index: number): void {
  update(sessionId, state => ({
    ...state,
    ignored: state.ignored.includes(index) ? state.ignored : [...state.ignored, index],
    adoptionSelection: state.adoptionSelection.filter(item => item !== index),
  }))
}

export function toggleTaskChip(sessionId: string): void {
  update(sessionId, state => ({
    ...state,
    selectedChips: { ...state.selectedChips, task: !state.selectedChips.task },
  }))
}

export function toggleConstraintChip(sessionId: string, index: number): void {
  update(sessionId, state => {
    const next = [...state.selectedChips.constraints]
    next[index] = next[index] !== true
    return { ...state, selectedChips: { ...state.selectedChips, constraints: next } }
  })
}

export function toggleSignalChip(sessionId: string, index: number): void {
  update(sessionId, state => {
    const next = [...state.selectedChips.signals]
    next[index] = next[index] !== true
    return { ...state, selectedChips: { ...state.selectedChips, signals: next } }
  })
}

/* ------------------------------------------------------------------ */
/* Shortcut bridge: the shortcut service cannot see a session composer. */
/* The currently mounted overlay panel claims the active session.       */
/* ------------------------------------------------------------------ */

let activeSessionId: string | undefined
const shortcutListeners = new Set<(sessionId: string) => void>()

export function setActiveSession(sessionId: string): void {
  activeSessionId = sessionId
}

export function clearActiveSession(sessionId: string): void {
  if (activeSessionId === sessionId) activeSessionId = undefined
}

export function onShortcutUplift(listener: (sessionId: string) => void): () => void {
  shortcutListeners.add(listener)
  return () => shortcutListeners.delete(listener)
}

export function requestShortcutUplift(): boolean {
  if (activeSessionId === undefined) return false
  const target = activeSessionId
  for (const listener of [...shortcutListeners]) listener(target)
  return true
}
