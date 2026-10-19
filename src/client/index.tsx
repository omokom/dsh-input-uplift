/**
 * Browser half. Registers a tool-row trigger and one non-modal overlay card.
 *
 * `slots` and `sessions` are hard Cordis services. `locale` and `shortcuts`
 * are optional and therefore injected through `ctx.inject` rather than being
 * placed in the top-level activation gate.
 */
import { TriggerButton } from './TriggerButton'
import { UpliftPanel, ensureStyles, removeStyles } from './UpliftPanel'
import { SidebarUpliftPane } from './SidebarTab'
import { SIDEBAR_TAB_ID, SIDEBAR_TAB_KIND } from './sidebar'
import { DICTIONARIES, LOCALE_NS, getLocale, setLocale, t } from './i18n'
import { isComposingNow } from './composition'
import { requestShortcutUplift } from './store'
import type {
  ClientContext,
  LocaleService,
  ScopedClientContext,
  ShortcutContext,
} from './types'

export const inject = ['slots', 'sessions']

function bridgeLocale(ctx: ClientContext): () => void {
  let disposed = false
  const cleanups: Array<() => void> = []
  ctx.inject(['locale'], (scope: ScopedClientContext) => {
    if (disposed) return
    const service = scope.get('locale') as LocaleService | undefined
    if (service === undefined) return
    for (const [localeId, dictionary] of Object.entries(DICTIONARIES)) {
      try {
        const off = service.register?.(LOCALE_NS, localeId, { ...dictionary })
        if (typeof off === 'function') cleanups.push(off)
      } catch {
        // A duplicate namespace owner is harmless: the card reads its own table.
      }
    }
    const sync = (): void => {
      try {
        const active = service.getLocale?.()?.active
        if (typeof active === 'string' && active !== '') setLocale(active)
      } catch {
        // Locale is presentation-only; never break the card over it.
      }
    }
    sync()
    try {
      const off = service.subscribe?.(sync)
      if (typeof off === 'function') cleanups.push(off)
    } catch {
      // Optional host service.
    }
  })
  return () => {
    disposed = true
    for (const cleanup of cleanups.splice(0)) {
      try {
        cleanup()
      } catch {
        // Disposal is best-effort.
      }
    }
  }
}

function registerShortcut(ctx: ClientContext): void {
  ctx.inject(['shortcuts'], (scope: ScopedClientContext) => {
    const service = scope.get('shortcuts') as ShortcutContext | undefined
    if (service === undefined || typeof service.register !== 'function') return
    const install = (): (() => void) => {
      try {
        const dispose = service.register({
          id: 'input.uplift',
          label: () => t(getLocale(), 'trigger.label'),
          aliases: ['input uplift', 'uplift input'],
          defaults: {
            'desktop:macos': { code: 'KeyU', modifiers: ['primary', 'alt'] },
            'desktop:windows': { code: 'KeyU', modifiers: ['primary', 'alt'] },
            'desktop:linux': { code: 'KeyU', modifiers: ['primary', 'alt'] },
            'web:macos': { code: 'KeyU', modifiers: ['primary', 'alt'] },
            'web:windows': { code: 'KeyU', modifiers: ['primary', 'alt'] },
          },
          regions: ['page', 'editable'],
          modals: [],
          resolve: () => ({
            status: 'handled',
            run: () => {
              if (!isComposingNow()) requestShortcutUplift()
            },
          }),
        })
        return typeof dispose === 'function' ? dispose : () => {}
      } catch (error) {
        console.warn(
          '[input-uplift] shortcut registration skipped:',
          error instanceof Error ? error.message : String(error),
        )
        return () => {}
      }
    }
    if (typeof scope.effect === 'function') {
      scope.effect(install, 'input-uplift: shortcut')
    } else {
      install()
    }
  })
}

const SIDEBAR_TAB_ID_LOCAL = SIDEBAR_TAB_ID
const SIDEBAR_TAB_KIND_LOCAL = SIDEBAR_TAB_KIND

interface SidebarRightTabsService {
  register: (definition: {
    id: string
    kind: string
    title: (address: string) => string
  }) => (() => void) | void
}

interface SidebarRightService {
  openTab: (kind: string, options?: Record<string, unknown>) => void
  active?: () => { id?: unknown } | undefined
  close?: (tabId: string) => void
}

function registerSidebarTab(ctx: ClientContext): void {
  ctx.inject(['sidebarRightTabs', 'sidebarRight'], (scope: ScopedClientContext) => {
    const tabs = scope.get('sidebarRightTabs') as SidebarRightTabsService | undefined
    const right = scope.get('sidebarRight') as SidebarRightService | undefined
    if (tabs === undefined || right === undefined) {
      console.warn('[input-uplift] sidebarRight services unavailable; side tab not registered')
      return
    }
    const install = (): (() => void) => {
      let disposeType: (() => void) | void
      try {
        disposeType = tabs.register({
          id: SIDEBAR_TAB_ID_LOCAL,
          kind: SIDEBAR_TAB_KIND_LOCAL,
          title: () => t(getLocale(), 'sidebar.title'),
        })
      } catch (error) {
        console.warn('[input-uplift] sidebar tab type registration skipped:', error instanceof Error ? error.message : String(error))
        return () => {}
      }
      ;(globalThis as unknown as { __iuSidebar?: unknown }).__iuSidebar = {
        openTab: (sessionId: string) => right.openTab(SIDEBAR_TAB_KIND_LOCAL, { params: { sessionId } }),
        closeActive: () => {
          try {
            const active = right.active?.()
            const tabId = active?.id
            if (typeof tabId === 'string' && typeof right.close === 'function') right.close(tabId)
          } catch {
            // Nothing to close is a normal state.
          }
        },
        isAvailable: () => true,
      }
      console.info('[input-uplift] sidebar tab type registered:', SIDEBAR_TAB_KIND_LOCAL)
      return () => {
        if (typeof disposeType === 'function') disposeType()
        if ((globalThis as unknown as { __iuSidebar?: unknown }).__iuSidebar !== undefined) {
          delete (globalThis as unknown as { __iuSidebar?: unknown }).__iuSidebar
        }
      }
    }
    if (typeof scope.effect === 'function') scope.effect(install, 'input-uplift: sidebar tab type')
    else install()
  })
}

/** Client entry. Returns a disposer so cordis can tear the slots down. */
export function apply(ctx: ClientContext): () => void {
  const disposers: Array<() => void> = []
  ensureStyles()
  disposers.push(removeStyles)

  const disposeTrigger = ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'input-uplift-trigger',
    order: 20,
  }, TriggerButton))
  if (typeof disposeTrigger === 'function') disposers.push(disposeTrigger)

  const disposeCard = ctx.slots.inject('conversation.input.overlay', () => ctx.slots.register({
    name: 'conversation.input.overlay',
    id: 'input-uplift-card',
    order: 20,
    locale: LOCALE_NS,
  }, UpliftPanel))
  if (typeof disposeCard === 'function') disposers.push(disposeCard)

  disposers.push(bridgeLocale(ctx))
  registerShortcut(ctx)
  registerSidebarTab(ctx)

  const disposeSidebarBody = ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
    name: 'sidebar.right.pane.tab',
    key: SIDEBAR_TAB_ID,
  }, SidebarUpliftPane))
  if (typeof disposeSidebarBody === 'function') disposers.push(disposeSidebarBody)

  console.info('[input-uplift] client active; trigger=conversation.input.right overlay=conversation.input.overlay')

  return () => {
    for (const dispose of disposers.splice(0)) {
      try {
        dispose()
      } catch {
        // Plugin teardown must continue through every registration.
      }
    }
  }
}
