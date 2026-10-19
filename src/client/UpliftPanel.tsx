/**
 * Floating uplift card, registered in `conversation.input.overlay`.
 *
 * The card never reads or writes the composer except on an explicit Replace /
 * Restore click. It is non-modal (no portal, no layout shift) and every
 * interactive control avoids taking editor focus on mousedown.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import type { AlignmentItem, AlignmentSeverity, UpliftResult } from '../host/contract'
import { isComposingNow, useComposing } from './composition'
import { errorText, t, useLocale, type Locale } from './i18n'
import {
  adoptAlignment,
  adoptSelectedAlignments,
  applySupplement,
  beginGeneration,
  clearActiveSession,
  closeSession,
  composeFinalText,
  disposeSession,
  getPreferredOptions,
  getSessionState,
  ignoreAlignment,
  markReplaced,
  onShortcutUplift,
  setActiveSession,
  setOptions,
  setReplaceError,
  setSupplement,
  toggleAlignmentSelection,
  toggleConstraintChip,
  toggleSignalChip,
  undoAdoptions,
  undoSupplement,
  usePreferredOptions,
  useSessionState,
} from './store'
import type { DetailLevel } from './store'
import { alreadyPresent } from '../host/compose'
import { closeUpliftSidebar, openUpliftSidebar } from './sidebar'
import type { InputSlotProps } from './types'

const STYLE_ID = 'dsh-input-uplift-client-css'

export function ensureStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return
  const style = document.createElement('style')
  style.dataset.plugin = '@local/dsh-input-uplift'
  style.dataset.pluginCss = STYLE_ID
  style.textContent = `
    .dsh-iu-trigger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,.07)) !important; }
    .dsh-iu-action:hover:not(:disabled) { filter: brightness(1.08); }
    .dsh-iu-chip:hover { border-color: var(--dsw-alias-border-l3, rgba(255,255,255,.24)) !important; }
    .dsh-iu-pulse { animation: dsh-iu-pulse 1.2s ease-in-out infinite; }
    .dsh-iu-scroll { scrollbar-width: thin; scrollbar-color: var(--dsw-alias-scrollbar-bg-l2, rgba(255,255,255,.16)) transparent; }
    .dsh-iu-scroll::-webkit-scrollbar { width: 8px; }
    .dsh-iu-scroll::-webkit-scrollbar-thumb { background: var(--dsw-alias-scrollbar-bg-l2, rgba(255,255,255,.16)); border-radius: 999px; }
    .dsh-iu-skeleton {
      height: 12px; border-radius: 6px;
      background: linear-gradient(90deg, var(--dsw-alias-bg-layer-2, #242424), var(--dsw-alias-bg-layer-4, #353535), var(--dsw-alias-bg-layer-2, #242424));
      background-size: 200% 100%;
      animation: dsh-iu-skeleton 1.4s ease-in-out infinite;
    }
    .dsh-iu-card button:focus-visible { outline: 2px solid var(--dsw-alias-label-link, #6ea8fe); outline-offset: 1px; }
    .dsh-iu-card .sr-only {
      position: absolute !important; width: 1px !important; height: 1px !important;
      padding: 0 !important; margin: -1px !important; overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important;
    }
    @keyframes dsh-iu-pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
    @keyframes dsh-iu-skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `
  document.head.appendChild(style)
}

export function removeStyles(): void {
  if (typeof document === 'undefined') return
  document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`)?.remove()
}

function actionStyle(kind: 'primary' | 'secondary' | 'ghost', disabled: boolean): CSSProperties {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 28,
    padding: '0 10px',
    borderRadius: 'var(--dsw-radius-sm, 6px)',
    fontFamily: 'inherit',
    fontSize: 12,
    lineHeight: '26px',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    whiteSpace: 'nowrap',
  }
  if (kind === 'primary') {
    return {
      ...base,
      border: '1px solid transparent',
      background: 'var(--dsw-alias-button-primary-fill, #4d6bfe)',
      color: '#fff',
      fontWeight: 600,
    }
  }
  if (kind === 'secondary') {
    return {
      ...base,
      border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))',
      background: 'var(--dsw-alias-bg-layer-3, #2a2a2a)',
      color: 'var(--dsw-alias-label-primary, #f2f2f2)',
    }
  }
  return {
    ...base,
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--dsw-alias-label-secondary, #b3b3b3)',
  }
}

interface ActionButtonProps {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  kind?: 'primary' | 'secondary' | 'ghost'
  title?: string
  ariaLabel?: string
  ariaPressed?: boolean
}

function ActionButton({
  children,
  onClick,
  disabled = false,
  kind = 'ghost',
  title,
  ariaLabel,
  ariaPressed,
}: ActionButtonProps): ReactElement {
  return (
    <button
      type="button"
      className="dsh-iu-action"
      style={actionStyle(kind, disabled)}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      onMouseDown={event => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function severityStyle(severity: AlignmentSeverity): CSSProperties {
  if (severity === 'high') {
    return {
      border: '1px solid rgba(235, 87, 87, .4)',
      background: 'rgba(235, 87, 87, .10)',
    }
  }
  if (severity === 'low') {
    return {
      border: '1px solid rgba(154, 154, 154, .28)',
      background: 'rgba(154, 154, 154, .07)',
    }
  }
  return {
    border: '1px solid rgba(234, 179, 8, .38)',
    background: 'rgba(234, 179, 8, .09)',
  }
}

interface AlignmentCardProps {
  item: AlignmentItem
  locale: Locale
  adopted: boolean
  selected: boolean
  disabled: boolean
  onAdopt: () => void
  onIgnore: () => void
  onToggleSelect: () => void
}

function AlignmentCard({ item, locale, adopted, selected, disabled, onAdopt, onIgnore, onToggleSelect }: AlignmentCardProps): ReactElement {
  return (
    <div style={{ ...severityStyle(item.severity), borderRadius: 8, padding: '8px 9px', display: 'grid', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={t(locale, 'alignment.select')}
          disabled={disabled || adopted}
          onMouseDown={event => event.preventDefault()}
          onClick={onToggleSelect}
          style={{
            border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.2))',
            background: selected ? 'var(--dsw-alias-label-link, #6ea8fe)' : 'transparent',
            color: selected ? '#fff' : 'var(--dsw-alias-label-secondary, #b3b3b3)',
            borderRadius: 5,
            width: 18,
            height: 18,
            lineHeight: '16px',
            fontSize: 11,
            padding: 0,
            cursor: adopted ? 'default' : 'pointer',
          }}
        >{selected ? '✓' : ''}</button>
        <strong style={{ fontSize: 12, color: 'var(--dsw-alias-label-primary, #f2f2f2)' }}>
          {t(locale, `alignment.${item.type}`)}
        </strong>
        <span style={{
          fontSize: 10,
          color: 'var(--dsw-alias-label-tertiary, #8c8c8c)',
          border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))',
          borderRadius: 999,
          padding: '0 5px',
          lineHeight: '16px',
        }}>
          {t(locale, `alignment.severity.${item.severity}`)}
        </span>
        <span style={{ flex: 1 }} />
        <ActionButton kind="ghost" disabled={disabled || adopted} onClick={onAdopt} ariaPressed={adopted}>
          {adopted ? `✓ ${t(locale, 'alignment.adopted')}` : t(locale, 'alignment.adopt')}
        </ActionButton>
        <ActionButton kind="ghost" disabled={disabled} onClick={onIgnore}>{t(locale, 'alignment.ignore')}</ActionButton>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--dsw-alias-label-primary, #f2f2f2)' }}>
        {item.claim}
      </div>
      <blockquote style={{
        margin: 0,
        padding: '5px 8px',
        borderLeft: '2px solid var(--dsw-alias-border-l3, rgba(255,255,255,.22))',
        color: 'var(--dsw-alias-label-secondary, #b3b3b3)',
        fontSize: 11,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        maxHeight: 100,
        overflowY: 'auto',
      }}>
        {t(locale, 'alignment.evidence', { from: item.evidence.from })}
        <br />
        “{item.evidence.quote}”
      </blockquote>
      {item.suggestion !== '' && (
        <div style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--dsw-alias-label-secondary, #b3b3b3)' }}>
          {t(locale, 'alignment.suggestion', { text: item.suggestion })}
        </div>
      )}
    </div>
  )
}

interface ChipProps {
  selected: boolean
  label: string
  text: string
  source: string
  locale: Locale
  disabled: boolean
  /** The rewrite already expresses this item; checking it would add nothing. */
  covered?: boolean
  onToggle: () => void
}

function Chip({ selected, label, text, source, locale, disabled, covered = false, onToggle }: ChipProps): ReactElement {
  const inactive = disabled || covered
  return (
    <button
      type="button"
      className="dsh-iu-chip"
      aria-pressed={selected}
      disabled={inactive}
      title={covered ? t(locale, 'chips.coveredHint') : undefined}
      onMouseDown={event => event.preventDefault()}
      onClick={onToggle}
      style={{
        display: 'inline-flex',
        alignItems: 'flex-start',
        gap: 5,
        maxWidth: '100%',
        padding: '4px 7px',
        border: selected
          ? '1px solid var(--dsw-alias-label-link, #6ea8fe)'
          : '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))',
        borderRadius: 7,
        background: selected ? 'var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,.07))' : 'transparent',
        color: 'var(--dsw-alias-label-primary, #f2f2f2)',
        font: 'inherit',
        fontSize: 11,
        lineHeight: 1.45,
        textAlign: 'left',
        cursor: inactive ? 'default' : 'pointer',
        opacity: inactive ? 0.65 : 1,
      }}
    >
      <span aria-hidden="true" style={{ color: selected ? 'var(--dsw-alias-label-link, #6ea8fe)' : 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
        {covered ? '•' : selected ? '✓' : '○'}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ color: 'var(--dsw-alias-label-tertiary, #8c8c8c)', marginRight: 4 }}>{label}</span>
        {text}
        <span style={{ color: 'var(--dsw-alias-label-tertiary, #8c8c8c)', marginLeft: 4 }}>· {source}</span>
        {covered && (
          <span style={{ color: 'var(--dsw-alias-label-tertiary, #8c8c8c)', marginLeft: 6 }}>
            · {t(locale, 'chips.covered')}
          </span>
        )}
        <span className="sr-only">{t(locale, 'chips.hint')}</span>
      </span>
    </button>
  )
}

function draftLocale(draft: string, fallback: Locale): Locale {
  return /[\u3400-\u9fff]/.test(draft) ? 'zh' : fallback
}

function sameDraft(left: string, right: string): boolean {
  // Conservative: any late edit (including whitespace) hides Restore original.
  return left === right
}

function kindLabel(locale: Locale, result: UpliftResult): string {
  return t(locale, `kind.${result.kind}`)
}

export function UpliftPanel({ sessionId, useInput, inputActions, variant = 'overlay' }: InputSlotProps & { variant?: 'overlay' | 'sidebar' }): ReactElement | null {
  const locale = useLocale()
  const composing = useComposing()
  const card = useSessionState(sessionId)
  const draft = useInput(state => state.draft)
  const draftRev = useInput(state => state.draftRev)
  const phase = useInput(state => state.phase)
  const occurrenceCount = useInput(state => state.occurrences?.length ?? 0)
  const attachmentCount = useInput(state => state.attachmentIds?.length ?? 0)
  const [confirmReferences, setConfirmReferences] = useState(false)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [cardMaxHeight, setCardMaxHeight] = useState<number | null>(null)
  const preferred = usePreferredOptions(sessionId)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [models, setModels] = useState<Array<{ id: string; name: string; models: Array<{ id: string; name: string }> }> | null>(null)
  const [modelsLoading, setModelsLoading] = useState(false)

  const latest = useRef({ draft, draftRev, phase })
  latest.current = { draft, draftRev, phase }

  const open = card.status !== 'idle'
  const sideMode = card.options.displayMode === 'side'
  const sidebarVariant = variant === 'sidebar'

  // Keep the floating card inside the space above the composer: a fixed
  // 52vh cap can run past the viewport top (e.g. an empty session where the
  // composer sits mid-screen), clipping the header. Measure the composer card
  // instead and scroll the body when the content is taller.
  useLayoutEffect(() => {
    if (!open || sidebarVariant) return
    const measure = (): void => {
      const composer = document.querySelector('[data-composer-card]')
      const top = composer instanceof HTMLElement && composer.getBoundingClientRect().top > 0
        ? composer.getBoundingClientRect().top
        : window.innerHeight * 0.62
      setCardMaxHeight(Math.max(200, Math.floor(top - 56)))
    }
    measure()
    window.addEventListener('resize', measure)
    const composer = document.querySelector('[data-composer-card]')
    const observer = typeof ResizeObserver === 'function' && composer instanceof HTMLElement ? new ResizeObserver(measure) : null
    if (observer !== null && composer instanceof HTMLElement) observer.observe(composer)
    const timer = window.setTimeout(measure, 120)
    return () => {
      window.removeEventListener('resize', measure)
      observer?.disconnect()
      window.clearTimeout(timer)
    }
  }, [open, sessionId, card.status])
  const result = card.result
  const generating = card.status === 'generating'
  const stale = card.status === 'ready' && card.genDraftRev !== draftRev
  const ignored = new Set(card.ignored)
  const adopted = new Set(card.adopted)
  const selectedForAdoption = new Set(card.adoptionSelection)
  const visibleAlignment = result === null
    ? []
    : result.alignment
      .map((item, index) => ({ item, index }))
      .filter(entry => !ignored.has(entry.index))
  const sameAsApplied = card.status === 'replaced' && sameDraft(draft, card.appliedText)
  const interactionsDisabled = card.status !== 'ready'
  const canActOnComposer = phase === 'plain' && !composing
  const finalText = result === null
    ? ''
    : composeFinalText(result, card.selectedChips, draftLocale(draft, locale))
  const replaceDisabled = result === null
    || card.status !== 'ready'
    || stale
    || !canActOnComposer
    || finalText.trim() === ''
    || result.no_uplift
  const canRegenerate = draft.trim() !== '' && phase === 'plain' && !composing
  const canRestore = card.status === 'replaced' && sameAsApplied && canActOnComposer

  useEffect(() => {
    setActiveSession(sessionId)
    return () => clearActiveSession(sessionId)
  }, [sessionId])

  // The floating overlay owns the card state. The sidebar copy must not dispose
  // it when its tab closes, otherwise switching back to the overlay loses the
  // result (and its replace/restore state).
  useEffect(() => () => {
    if (!sidebarVariant) disposeSession(sessionId)
  }, [sessionId, sidebarVariant])

  useEffect(() => onShortcutUplift((target) => {
    if (target !== sessionId) return
    const snapshot = latest.current
    if (snapshot.phase !== 'plain' || snapshot.draft.trim() === '' || isComposingNow()) return
    if (getSessionState(sessionId).status === 'generating') return
    const options = getPreferredOptions(sessionId)
    beginGeneration(sessionId, snapshot.draft, snapshot.draftRev, options, '', true)
    if (options.displayMode === 'side') openUpliftSidebar(sessionId)
  }), [sessionId])

  // "Auto-uplift after N seconds of idle input": N is user-defined (0 = off).
  // Restart the timer on every draft change; never auto-uplift the plugin's own
  // replacement output (that would nest a second uplift).
  const autoDelay = preferred.autoDelaySeconds
  useEffect(() => {
    if (autoDelay <= 0) return
    const current = getSessionState(sessionId)
    if (draft.trim() === '' || phase !== 'plain' || composing) return
    if (current.status === 'generating') return
    if (current.status === 'replaced' && sameDraft(draft, current.appliedText)) return
    const rev = draftRev
    const timer = window.setTimeout(() => {
      const snapshot = latest.current
      if (snapshot.draftRev !== rev || snapshot.draft.trim() === '' || snapshot.phase !== 'plain' || isComposingNow()) return
      const state = getSessionState(sessionId)
      if (state.status === 'generating') return
      if (state.status === 'replaced' && sameDraft(snapshot.draft, state.appliedText)) return
      if (state.genDraftRev === rev && state.status !== 'idle') return
      const options = getPreferredOptions(sessionId)
      beginGeneration(sessionId, snapshot.draft, snapshot.draftRev, options, '', true)
      if (options.displayMode === 'side') openUpliftSidebar(sessionId)
    }, autoDelay * 1000)
    return () => window.clearTimeout(timer)
  }, [autoDelay, draft, draftRev, phase, composing, sessionId, card.status, card.appliedText])

  // Lazy model catalog for the settings panel. Note the dependency list omits
  // `modelsLoading` on purpose: toggling loading must not cancel the in-flight
  // request (that cancellation loop left the selector empty in testing).
  useEffect(() => {
    if (!settingsOpen || models !== null) return
    let cancelled = false
    setModelsLoading(true)
    void (async () => {
      try {
        const response = await fetch('/api/input-uplift/models')
        const body = await response.json() as { ok?: unknown; providers?: unknown }
        if (cancelled) return
        if (response.ok && body.ok === true && Array.isArray(body.providers)) {
          setModels((body.providers as Array<{ id: string; name: string; models: Array<{ id: string; name: string }> }>))
        } else {
          setModels([])
        }
      } catch {
        if (!cancelled) setModels([])
      } finally {
        if (!cancelled) setModelsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [settingsOpen, models])

  // Close the card as soon as the draft is sent. Optimistic sends clear the
  // draft and move the input phase through `submitting`, but the phase can be
  // too brief to rely on alone — watch the cleared draft as well.
  useEffect(() => {
    if (card.status === 'idle') return
    if (phase === 'submitting') {
      closeSession(sessionId)
      return
    }
    if (draft === '' && card.status !== 'generating') closeSession(sessionId)
  }, [phase, draft, card.status, sessionId])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || isComposingNow()) return
      event.preventDefault()
      closeSession(sessionId)
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open, sessionId])

  useEffect(() => {
    setConfirmReferences(false)
  }, [card.requestId, draftRev])

  if (!open) return null
  // In side mode the result lives in the DSH right-sidebar tab, not over the
  // composer. The overlay component stays mounted for its auto-uplift/close
  // effects but renders nothing.
  if (sideMode && !sidebarVariant) return null

  const close = (): void => {
    closeSession(sessionId)
  }

  const regenerate = (): void => {
    if (!canRegenerate) return
    beginGeneration(sessionId, draft, draftRev, card.options, card.supplement, false)
  }

  const replace = (): void => {
    if (replaceDisabled || result === null) return
    if (isComposingNow()) return
    if (occurrenceCount > 0 && !confirmReferences) {
      setConfirmReferences(true)
      return
    }
    try {
      if (occurrenceCount > 0) {
        inputActions.setDraft(finalText)
        markReplaced(sessionId, finalText, 'setDraft')
      } else {
        const ok = inputActions.insertText(finalText, { start: 0, end: draft.length, draftRev })
        if (!ok) {
          setReplaceError(sessionId, 'REPLACE_REJECTED', 'insertText returned false')
          return
        }
        markReplaced(sessionId, finalText, 'insert')
      }
      setConfirmReferences(false)
    } catch (error) {
      setReplaceError(sessionId, 'REPLACE_REJECTED', error instanceof Error ? error.message : '')
    }
  }

  const restore = (): void => {
    if (card.status !== 'replaced' || !sameAsApplied) return
    if (isComposingNow()) return
    try {
      if (card.replaceMode === 'setDraft' || occurrenceCount > 0) {
        inputActions.setDraft(card.originalDraft)
      } else {
        const ok = inputActions.insertText(card.originalDraft, {
          start: 0,
          end: draft.length,
          draftRev,
        })
        if (!ok) {
          setReplaceError(sessionId, 'RESTORE_REJECTED', 'insertText returned false')
          return
        }
      }
      closeSession(sessionId)
    } catch (error) {
      setReplaceError(sessionId, 'RESTORE_REJECTED', error instanceof Error ? error.message : '')
    }
  }

  const handleIgnore = (index: number): void => {
    ignoreAlignment(sessionId, index)
  }

  const headerKind = result === null ? null : kindLabel(locale, result)
  const showRewrite = result !== null && !generating && card.status !== 'error'
  const showOnlyReminder = result !== null && result.rewrite.trim() === '' && !result.no_uplift
  const noUplift = result?.no_uplift === true
  const replaceErrorText = card.replaceError === null
    ? ''
    : errorText(locale, card.replaceError.code, card.replaceError.message)

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label={t(locale, 'panel.title')}
      data-input-uplift-card=""
      data-input-uplift-session={sessionId}
      className="dsh-iu-card"
      style={{
        zIndex: sidebarVariant ? 'auto' : 1000,
        ...(sidebarVariant
          ? {
              position: 'relative' as const,
              width: '100%',
              height: '100%',
              maxWidth: 'none',
              maxHeight: 'none',
              margin: 0,
            }
          : {
              position: 'absolute' as const,
              left: 0,
              right: 0,
              bottom: 'calc(100% + 8px)',
              maxWidth: 'var(--dsh-composer-card-max-width, 860px)',
              margin: '0 auto',
              maxHeight: cardMaxHeight === null ? 'min(52vh, 460px)' : cardMaxHeight,
            }),
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: sidebarVariant ? 'none' : '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))',
        borderRadius: sidebarVariant ? 0 : 'var(--dsw-radius-panel, 12px)',
        background: sidebarVariant ? 'transparent' : 'var(--dsw-specific-input-major, var(--dsw-alias-bg-layer-1, #ffffff))',
        backdropFilter: sidebarVariant ? 'none' : 'blur(18px)',
        WebkitBackdropFilter: sidebarVariant ? 'none' : 'blur(18px)',
        boxShadow: sidebarVariant ? 'none' : 'var(--dsw-elevation-prominent, 0 12px 40px rgba(0,0,0,.42))',
        color: 'var(--dsw-alias-label-primary, #f2f2f2)',
        fontFamily: 'var(--dsw-font-family, inherit)',
        fontSize: 12,
        isolation: sidebarVariant ? 'auto' : 'isolate',
      }}
    >
      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 12px',
        borderBottom: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))',
        flexShrink: 0,
      }}>
        <strong style={{ fontSize: 13 }}>✦ {t(locale, 'panel.title')}</strong>
        {headerKind !== null && (
          <span style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 999,
            border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))',
            color: 'var(--dsw-alias-label-secondary, #b3b3b3)',
            lineHeight: '16px',
          }}>
            {headerKind}
          </span>
        )}
        {result?.mock === true && (
          <span style={{ fontSize: 10, color: 'var(--dsw-alias-state-warn, #d6a400)' }}>
            {t(locale, 'panel.mock')}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <ActionButton
          kind="ghost"
          ariaLabel={t(locale, sidebarVariant || sideMode ? 'panel.undock' : 'panel.dock')}
          title={t(locale, sidebarVariant || sideMode ? 'panel.undock' : 'panel.dock')}
          onClick={() => {
            if (sidebarVariant || sideMode) {
              setOptions(sessionId, { displayMode: 'overlay' })
              closeUpliftSidebar()
              return
            }
            setOptions(sessionId, { displayMode: 'side' })
            openUpliftSidebar(sessionId)
          }}
        >
          {sidebarVariant || sideMode ? '⇤' : '⇥'}
        </ActionButton>
        <ActionButton
          kind="ghost"
          ariaLabel={t(locale, 'settings.open')}
          ariaPressed={settingsOpen}
          title={t(locale, 'settings.open')}
          onClick={() => setSettingsOpen(open => !open)}
        >
          ⚙
        </ActionButton>
        <ActionButton kind="ghost" ariaLabel={t(locale, 'panel.close')} onClick={close}>✕</ActionButton>
      </header>

      <div className="dsh-iu-scroll" style={{ overflowY: 'auto', minHeight: 0, flex: 1, padding: '10px 12px', display: 'grid', gap: 10 }}>
        {generating && (
          <div aria-live="polite" style={{ display: 'grid', gap: 7, padding: '4px 0' }}>
            <div style={{ color: 'var(--dsw-alias-label-secondary, #b3b3b3)' }}>
              {t(locale, 'panel.generating')}
            </div>
            <div className="dsh-iu-skeleton" style={{ width: '88%' }} />
            <div className="dsh-iu-skeleton" style={{ width: '72%' }} />
            <div className="dsh-iu-skeleton" style={{ width: '80%' }} />
            <div style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)', marginTop: 2 }}>
              {t(locale, 'panel.generatingHint')}
            </div>
          </div>
        )}

        {card.status === 'error' && card.error !== null && (
          <div role="alert" style={{ display: 'grid', gap: 6 }}>
            <strong style={{ color: 'var(--dsw-alias-label-error, #f06a6a)' }}>{t(locale, 'panel.errorTitle')}</strong>
            <div style={{ lineHeight: 1.6 }}>{errorText(locale, card.error.code, card.error.message)}</div>
            {card.error.code !== '' && (
              <code style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>{card.error.code}</code>
            )}
          </div>
        )}

        {stale && (
          <div role="alert" style={{
            border: '1px solid rgba(234,179,8,.42)',
            background: 'rgba(234,179,8,.10)',
            borderRadius: 8,
            padding: '7px 9px',
            display: 'grid',
            gap: 3,
          }}>
            <strong>{t(locale, 'panel.staleTitle')}</strong>
            <span style={{ color: 'var(--dsw-alias-label-secondary, #b3b3b3)', lineHeight: 1.55 }}>
              {t(locale, 'panel.staleBody')}
            </span>
          </div>
        )}

        {result?.unstructured === true && (
          <div style={{
            border: '1px solid rgba(234,179,8,.4)',
            background: 'rgba(234,179,8,.08)',
            borderRadius: 8,
            padding: '7px 9px',
            color: 'var(--dsw-alias-label-secondary, #b3b3b3)',
            lineHeight: 1.55,
          }}>
            {t(locale, 'panel.unstructured')}
          </div>
        )}

        {showRewrite && noUplift && (
          <div style={{
            border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))',
            borderRadius: 8,
            padding: '8px 9px',
            lineHeight: 1.55,
          }}>
            <strong>{t(locale, 'panel.noUplift')}</strong>
            {result.reason !== '' && (
              <div style={{ color: 'var(--dsw-alias-label-secondary, #b3b3b3)', marginTop: 3 }}>{result.reason}</div>
            )}
          </div>
        )}

        {showRewrite && visibleAlignment.length > 0 && (
          <section style={{ display: 'grid', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--dsw-alias-state-warn, #d6a400)' }}>
                ⚠ {t(locale, 'alignment.title', { count: visibleAlignment.length })}
              </strong>
              {adopted.size > 0 && (
                <span style={{ fontSize: 10, color: 'var(--dsw-alias-label-link, #6ea8fe)' }}>
                  {t(locale, 'alignment.adoptedCount', { count: adopted.size })}
                </span>
              )}
              <span style={{ flex: 1 }} />
              {card.adoptionSelection.length > 0 && (
                <ActionButton
                  kind="secondary"
                  disabled={interactionsDisabled}
                  onClick={() => adoptSelectedAlignments(sessionId)}
                >
                  {t(locale, 'alignment.adoptSelected', { count: card.adoptionSelection.length })}
                </ActionButton>
              )}
              {adopted.size > 0 && (
                <ActionButton kind="ghost" disabled={interactionsDisabled} onClick={() => undoAdoptions(sessionId)}>
                  {t(locale, 'alignment.undoAdoptions')}
                </ActionButton>
              )}
              {ignored.size > 0 && (
                <span style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
                  {t(locale, 'alignment.ignoredCount', { count: ignored.size })}
                </span>
              )}
            </div>
            {visibleAlignment.map(({ item, index }) => (
              <AlignmentCard
                key={`${item.type}-${index}`}
                item={item}
                locale={locale}
                adopted={adopted.has(index)}
                selected={selectedForAdoption.has(index)}
                disabled={interactionsDisabled}
                onAdopt={() => adoptAlignment(sessionId, index)}
                onIgnore={() => handleIgnore(index)}
                onToggleSelect={() => toggleAlignmentSelection(sessionId, index)}
              />
            ))}
            <div style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
              {t(locale, 'alignment.note')}
            </div>
          </section>
        )}

        {showRewrite && (result.brief.scope !== '' || result.brief.approach !== '') && (
          <section
            data-input-uplift-brief=""
            style={{
              display: 'grid',
              gap: 4,
              fontSize: 11,
              lineHeight: 1.6,
              color: 'var(--dsw-alias-label-secondary, #b3b3b3)',
              border: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))',
              borderRadius: 8,
              padding: '7px 9px',
            }}
          >
            <strong style={{ color: 'var(--dsw-alias-label-primary, #f2f2f2)' }}>{t(locale, 'panel.understanding')}</strong>
            {result.brief.scope !== '' && <div>{t(locale, 'brief.scope', { text: result.brief.scope })}</div>}
            {result.brief.approach !== '' && <div>{t(locale, 'brief.approach', { text: result.brief.approach })}</div>}
          </section>
        )}

        {showRewrite && (
          <section style={{ display: 'grid', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong>{t(locale, 'rewrite.title')}</strong>
              <span style={{
                fontSize: 10,
                color: 'var(--dsw-alias-label-tertiary, #8c8c8c)',
                border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))',
                borderRadius: 999,
                padding: '0 5px',
              }}>
                {t(locale, 'rewrite.safe')}
              </span>
            </div>
            {finalText.trim() === '' ? (
              <div style={{ color: 'var(--dsw-alias-label-secondary, #b3b3b3)', lineHeight: 1.55 }}>
                {showOnlyReminder ? t(locale, 'rewrite.emptyReminder') : t(locale, 'rewrite.empty')}
              </div>
            ) : (
              <div style={{
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                lineHeight: 1.65,
                padding: '8px 9px',
                border: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))',
                borderRadius: 8,
                background: 'var(--dsw-alias-bg-layer-1, #1a1a1a)',
              }}>
                {finalText}
              </div>
            )}
          </section>
        )}

        {showRewrite && (
          <section style={{ display: 'grid', gap: 6 }}>
            <strong>{t(locale, 'chips.title')}</strong>
            {(
              result.constraints.length > 0
              || result.signals.length > 0
            ) ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.constraints.map((item, index) => (
                  <Chip
                    key={`constraint-${index}`}
                    selected={card.selectedChips.constraints[index] === true}
                    label={t(locale, 'chips.constraint')}
                    text={item.text}
                    source={t(locale, `chips.source.${item.source}`)}
                    locale={locale}
                    disabled={interactionsDisabled}
                    covered={alreadyPresent(result.rewrite, item.text)}
                    onToggle={() => toggleConstraintChip(sessionId, index)}
                  />
                ))}
                {result.signals.map((signal, index) => (
                  <Chip
                    key={`signal-${index}`}
                    selected={card.selectedChips.signals[index] === true}
                    label={t(locale, 'chips.signal')}
                    text={signal}
                    source={t(locale, 'chips.source.context')}
                    locale={locale}
                    disabled={interactionsDisabled}
                    covered={alreadyPresent(result.rewrite, signal)}
                    onToggle={() => toggleSignalChip(sessionId, index)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
                {t(locale, 'chips.none')}
              </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
              {t(locale, 'chips.hint')}
            </div>
          </section>
        )}

        {settingsOpen && !generating && (
          <section
            data-input-uplift-settings=""
            style={{
              display: 'grid',
              gap: 7,
              order: -1,
              borderTop: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))',
              paddingTop: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong style={{ fontSize: 11 }}>{t(locale, 'settings.title')}</strong>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
                {t(locale, 'settings.hint')}
              </span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <span style={{ width: 64, color: 'var(--dsw-alias-label-secondary, #b3b3b3)' }}>{t(locale, 'settings.detailLevel')}</span>
              <select
                value={card.options.detailLevel}
                onChange={event => setOptions(sessionId, { detailLevel: event.target.value as DetailLevel })}
                style={{ font: 'inherit', fontSize: 11, padding: '2px 6px', borderRadius: 6 }}
              >
                <option value="concise">{t(locale, 'settings.detail.concise')}</option>
                <option value="standard">{t(locale, 'settings.detail.standard')}</option>
                <option value="detailed">{t(locale, 'settings.detail.detailed')}</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <span style={{ width: 64, color: 'var(--dsw-alias-label-secondary, #b3b3b3)' }}>{t(locale, 'settings.balanced')}</span>
              <input
                type="checkbox"
                checked={card.options.balanced}
                onChange={event => setOptions(sessionId, { balanced: event.target.checked })}
              />
              <span style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
                {t(locale, 'settings.balancedHint')}
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <span style={{ width: 64, color: 'var(--dsw-alias-label-secondary, #b3b3b3)' }}>{t(locale, 'settings.display')}</span>
              <select
                value={card.options.displayMode}
                onChange={event => {
                  const mode = event.target.value === 'side' ? 'side' : 'overlay'
                  setOptions(sessionId, { displayMode: mode })
                  if (mode === 'side') openUpliftSidebar(sessionId)
                  else closeUpliftSidebar()
                }}
                style={{ font: 'inherit', fontSize: 11, padding: '2px 6px', borderRadius: 6 }}
              >
                <option value="overlay">{t(locale, 'settings.display.overlay')}</option>
                <option value="side">{t(locale, 'settings.display.side')}</option>
              </select>
              <span style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
                {t(locale, 'settings.displayHint')}
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <span style={{ width: 64, color: 'var(--dsw-alias-label-secondary, #b3b3b3)' }}>{t(locale, 'settings.model')}</span>
              <select
                value={card.options.provider === '' || card.options.model === '' ? '' : `${card.options.provider}|${card.options.model}`}
                onChange={event => {
                  const value = event.target.value
                  if (value === '') {
                    setOptions(sessionId, { provider: '', model: '' })
                    return
                  }
                  const at = value.indexOf('|')
                  if (at < 0) return
                  setOptions(sessionId, { provider: value.slice(0, at), model: value.slice(at + 1) })
                }}
                style={{ font: 'inherit', fontSize: 11, padding: '2px 6px', borderRadius: 6, maxWidth: 260 }}
              >
                <option value="">{t(locale, 'settings.modelFollow')}</option>
                {(models ?? []).map(provider => (
                  <optgroup key={provider.id} label={provider.name}>
                    {provider.models.map(model => (
                      <option key={`${provider.id}|${model.id}`} value={`${provider.id}|${model.id}`}>
                        {model.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {models !== null && models.length === 0 && (
                <span style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
                  {t(locale, 'settings.modelEmpty')}
                </span>
              )}
              {modelsLoading && (
                <span style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
                  {t(locale, 'settings.modelLoading')}
                </span>
              )}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
              <span style={{ width: 64, color: 'var(--dsw-alias-label-secondary, #b3b3b3)' }}>{t(locale, 'settings.auto')}</span>
              <input
                type="number"
                min={0}
                max={120}
                step={1}
                value={card.options.autoDelaySeconds}
                aria-label={t(locale, 'settings.auto')}
                onChange={event => {
                  const value = Number(event.target.value)
                  setOptions(sessionId, {
                    autoDelaySeconds: Number.isFinite(value) ? Math.min(120, Math.max(0, Math.floor(value))) : 0,
                  })
                }}
                style={{ width: 64, font: 'inherit', fontSize: 11, padding: '2px 6px', borderRadius: 6 }}
              />
              <span style={{ fontSize: 10, color: 'var(--dsw-alias-label-secondary, #b3b3b3)' }}>
                {t(locale, 'settings.autoUnit')}
              </span>
              <span style={{ fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
                {t(locale, 'settings.autoHint')}
              </span>
            </label>
          </section>
        )}

        {showRewrite && (
          <details style={{ borderTop: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))', paddingTop: 8 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--dsw-alias-label-secondary, #b3b3b3)' }}>
              {t(locale, 'inference.title')}
              {' · '}
              {t(locale, 'inference.summary', {
                inferred: result.assumptions.length + result.inferred_in_rewrite.length,
                unknowns: result.unknowns.length,
              })}
            </summary>
            <div style={{ display: 'grid', gap: 7, padding: '7px 2px 0' }}>
              {result.brief.purpose !== '' || result.brief.scope !== '' || result.brief.approach !== '' || result.brief.acceptance !== '' || result.brief.chain !== '' || result.assumptions.length > 0 || result.inferred_in_rewrite.length > 0 || result.unknowns.length > 0 ? (
                <>
                  {(result.brief.purpose !== '' || result.brief.acceptance !== '' || result.brief.chain !== '') && (
                    <div style={{ fontSize: 11, color: 'var(--dsw-alias-label-secondary, #b3b3b3)', lineHeight: 1.6 }}>
                      <strong style={{ color: 'var(--dsw-alias-label-primary, #f2f2f2)' }}>{t(locale, 'panel.understanding')}</strong>
                      {result.brief.purpose !== '' && <div>{result.brief.purpose}</div>}
                      {result.brief.chain !== '' && <div>{result.brief.chain}</div>}
                      {result.brief.acceptance !== '' && <div>{result.brief.acceptance}</div>}
                    </div>
                  )}
                  {result.assumptions.length > 0 && (
                    <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                      <strong>{t(locale, 'inference.assumptions')}</strong>
                      {result.assumptions.map((item, index) => (
                        <div key={`assumption-${index}`} style={{ color: 'var(--dsw-alias-label-secondary, #b3b3b3)', marginTop: 3 }}>
                          · {item.text}
                          <span style={{ marginLeft: 4, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
                            ({item.reversible ? t(locale, 'inference.reversible') : t(locale, 'inference.irreversible')})
                          </span>
                          {item.consequence !== '' && (
                            <div style={{ marginLeft: 8, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
                              {t(locale, 'inference.consequence', { text: item.consequence })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.inferred_in_rewrite.length > 0 && (
                    <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                      <strong>{t(locale, 'inference.inferred')}</strong>
                      {result.inferred_in_rewrite.map((item, index) => (
                        <div key={`inferred-${index}`} style={{ color: 'var(--dsw-alias-label-secondary, #b3b3b3)', marginTop: 2 }}>
                          · {item}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.unknowns.length > 0 && (
                    <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                      <strong>{t(locale, 'inference.unknowns')}</strong>
                      {result.unknowns.map((item, index) => (
                        <div key={`unknown-${index}`} style={{ color: 'var(--dsw-alias-label-secondary, #b3b3b3)', marginTop: 2 }}>
                          · {item}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
                  {t(locale, 'inference.none')}
                </div>
              )}
            </div>
          </details>
        )}

        {replaceErrorText !== '' && (
          <div role="alert" style={{ color: 'var(--dsw-alias-label-error, #f06a6a)', lineHeight: 1.55 }}>
            {replaceErrorText}
          </div>
        )}
      </div>

      {showRewrite && !generating && (
        <section
          data-input-uplift-supplement-wrap=""
          style={{
            margin: '0 12px 8px',
            borderTop: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))',
            paddingTop: 8,
            display: 'grid',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 11 }}>{t(locale, 'supplement.title')}</strong>
            {card.supplementApplied && (
              <span style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 999,
                background: 'rgba(77, 107, 254, .14)',
                color: 'var(--dsw-alias-label-link, #6ea8fe)',
              }}>
                {t(locale, 'supplement.applied')}
              </span>
            )}
            <span style={{ flex: 1 }} />
            {card.supplementApplied ? (
              <ActionButton kind="ghost" onClick={() => undoSupplement(sessionId)}>
                {t(locale, 'supplement.undo')}
              </ActionButton>
            ) : (
              <ActionButton
                kind="secondary"
                disabled={card.supplement.trim() === '' || interactionsDisabled || stale}
                onClick={() => applySupplement(sessionId)}
              >
                {t(locale, 'supplement.apply')}
              </ActionButton>
            )}
            <ActionButton
              kind="secondary"
              disabled={!canRegenerate || card.supplement.trim() === ''}
              onClick={() => beginGeneration(sessionId, draft, draftRev, card.options, card.supplement, false)}
            >
              {t(locale, 'supplement.regenerate')}
            </ActionButton>
          </div>
          <textarea
            data-input-uplift-supplement=""
            value={card.supplement}
            rows={2}
            placeholder={t(locale, 'supplement.placeholder')}
            aria-label={t(locale, 'supplement.title')}
            onChange={event => setSupplement(sessionId, event.target.value)}
            onMouseDown={event => event.stopPropagation()}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              minHeight: 40,
              maxHeight: 120,
              padding: '6px 8px',
              borderRadius: 8,
              border: '1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.12))',
              background: 'var(--dsw-alias-interactive-bg-hover, rgba(0,0,0,.04))',
              color: 'inherit',
              font: 'inherit',
              fontSize: 12,
              lineHeight: 1.5,
            }}
          />
        </section>
      )}

      {confirmReferences && card.status === 'ready' && !stale && (
        <div style={{
          margin: '0 12px 8px',
          border: '1px solid rgba(234,179,8,.42)',
          background: 'rgba(234,179,8,.08)',
          borderRadius: 8,
          padding: '8px 9px',
          display: 'grid',
          gap: 6,
        }}>
          <strong>{t(locale, 'panel.chipWarningTitle')}</strong>
          <div style={{ color: 'var(--dsw-alias-label-secondary, #b3b3b3)', lineHeight: 1.55 }}>
            {t(locale, 'panel.chipWarningBody')}
          </div>
          {attachmentCount > 0 && (
            <div style={{ fontSize: 11, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
              {t(locale, 'panel.attachmentNote', { count: attachmentCount })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            <ActionButton kind="primary" onClick={replace}>{t(locale, 'panel.confirmRemoveRefs')}</ActionButton>
            <ActionButton kind="ghost" onClick={() => setConfirmReferences(false)}>{t(locale, 'panel.cancel')}</ActionButton>
          </div>
        </div>
      )}

      <footer style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px',
        borderTop: '1px solid var(--dsw-alias-border-l1, rgba(255,255,255,.09))',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <span style={{ flex: 1, minWidth: 130, fontSize: 10, color: 'var(--dsw-alias-label-tertiary, #8c8c8c)' }}>
          {card.status === 'replaced'
            ? (sameAsApplied ? t(locale, 'panel.readonlyReplaced') : t(locale, 'panel.restoreUnavailable'))
            : t(locale, 'panel.sourceNote')}
        </span>

        {generating && (
          <ActionButton kind="secondary" onClick={close}>{t(locale, 'panel.stop')}</ActionButton>
        )}

        {card.status === 'error' && (
          <>
            <ActionButton kind="primary" disabled={!canRegenerate} onClick={regenerate}>{t(locale, 'panel.retry')}</ActionButton>
            <ActionButton kind="ghost" onClick={close}>{t(locale, 'actions.close')}</ActionButton>
          </>
        )}

        {card.status === 'ready' && stale && (
          <>
            <ActionButton kind="primary" disabled={!canRegenerate} onClick={regenerate}>{t(locale, 'actions.regenerateNew')}</ActionButton>
            <ActionButton kind="ghost" onClick={close}>{t(locale, 'actions.close')}</ActionButton>
          </>
        )}

        {card.status === 'ready' && !stale && !noUplift && (
          <>
            <ActionButton kind="primary" disabled={replaceDisabled} onClick={replace} title={stale ? t(locale, 'panel.staleBody') : undefined}>
              {t(locale, 'actions.replace')}
            </ActionButton>
            <ActionButton kind="secondary" disabled={!canRegenerate} onClick={regenerate}>{t(locale, 'actions.regenerate')}</ActionButton>
            <ActionButton kind="ghost" onClick={close}>{t(locale, 'actions.close')}</ActionButton>
          </>
        )}

        {card.status === 'ready' && !stale && noUplift && (
          <>
            <ActionButton kind="secondary" disabled={!canRegenerate} onClick={regenerate}>{t(locale, 'actions.regenerate')}</ActionButton>
            <ActionButton kind="ghost" onClick={close}>{t(locale, 'actions.close')}</ActionButton>
          </>
        )}

        {card.status === 'replaced' && (
          <>
            {sameAsApplied && (
              <ActionButton kind="primary" disabled={!canRestore} onClick={restore}>{t(locale, 'actions.restore')}</ActionButton>
            )}
            <ActionButton kind="secondary" disabled={!canRegenerate} onClick={regenerate}>{t(locale, 'actions.regenerate')}</ActionButton>
            <ActionButton kind="ghost" onClick={close}>{t(locale, 'actions.close')}</ActionButton>
          </>
        )}
      </footer>
    </div>
  )
}
