/** Local ambient shapes for the undocumented session-slot props. */

export interface InputSnapshot {
  draft: string
  draftRev: number
  phase: string
  occurrences: ReadonlyArray<unknown>
  attachmentIds: ReadonlyArray<string>
}

export interface InputActions {
  insertText: (text: string, span: { start: number; end: number; draftRev: number }) => boolean
  setDraft: (text: string) => void
}

export interface InputSlotProps {
  sessionId: string
  useInput: <T>(selector: (state: InputSnapshot) => T) => T
  inputActions: InputActions
}

export interface SlotRegistration {
  name: string
  /** Ordinary slotted entry id; keyed slots use `key` instead. */
  id?: string
  /** Keyed slot entry (sidebar.right.pane.tab uses the tab type id here). */
  key?: string
  order?: number
  locale?: string
  inject?: (sessionId: string) => Record<string, unknown>
}

export interface ScopedClientContext {
  get: (name: string) => unknown
  effect?: <T>(setup: () => T, label?: string) => T
}

export interface ClientContext extends ScopedClientContext {
  slots: {
    inject: (slot: string, register: () => () => void) => () => void
    register: (options: SlotRegistration, component: unknown) => () => void
  }
  inject: (names: string[], callback: (scope: ScopedClientContext) => void) => void
}

export interface LocaleService {
  register?: (namespace: string, locale: string, dictionary: Record<string, string>) => (() => void) | void
  getLocale?: () => { active?: string } | undefined
  subscribe?: (listener: () => void) => (() => void) | void
}

export interface ShortcutContext {
  register: (options: {
    id: string
    label: () => string
    aliases?: string[]
    defaults: Record<string, { code: string; modifiers: string[] }>
    regions: string[]
    modals: string[]
    resolve: () => { status: 'handled'; run: () => void }
  }) => () => void
}
