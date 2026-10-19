/**
 * Body of the DSH right-sidebar tab (`sidebar.right.pane.tab`). The slot
 * supplies session-scoped props (sessionId/useInput/inputActions/…), so the
 * regular UpliftPanel can be rendered inline instead of the floating card.
 */
import type { ReactElement } from 'react'
import { useComposing } from './composition'
import { t, useLocale } from './i18n'
import { beginGeneration, getPreferredOptions, useSessionState } from './store'
import { closeUpliftSidebar } from './sidebar'
import { UpliftPanel } from './UpliftPanel'
import type { InputSlotProps } from './types'

export type SidebarPaneProps = InputSlotProps & Record<string, unknown>

function emptyStateStyle(): Record<string, string | number> {
  return {
    height: '100%',
    display: 'grid',
    alignContent: 'center',
    justifyItems: 'center',
    gap: 10,
    padding: 20,
    color: 'var(--dsw-alias-label-secondary, #b3b3b3)',
    textAlign: 'center',
  }
}

export function SidebarUpliftPane(props: SidebarPaneProps): ReactElement {
  const { sessionId, useInput, inputActions } = props
  const locale = useLocale()
  const composing = useComposing()
  const card = useSessionState(sessionId)
  const draft = useInput(state => state.draft)
  const draftRev = useInput(state => state.draftRev)
  const phase = useInput(state => state.phase)
  const canGenerate = draft.trim() !== '' && phase === 'plain' && !composing && card.status !== 'generating'

  if (card.status === 'idle') {
    return (
      <div data-input-uplift-sidebar-empty="" style={emptyStateStyle()}>
        <strong style={{ fontSize: 13, color: 'var(--dsw-alias-label-primary, #f2f2f2)' }}>
          {t(locale, 'sidebar.empty')}
        </strong>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>{t(locale, 'sidebar.emptyHint')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            disabled={!canGenerate}
            onMouseDown={event => event.preventDefault()}
            onClick={() => {
              if (!canGenerate) return
              beginGeneration(sessionId, draft, draftRev, getPreferredOptions(sessionId), '', true)
            }}
            style={{
              height: 28,
              padding: '0 12px',
              borderRadius: 7,
              border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))',
              background: 'var(--dsw-alias-state-business-primary, #4d6bfe)',
              color: '#fff',
              font: 'inherit',
              fontSize: 12,
              cursor: canGenerate ? 'pointer' : 'default',
              opacity: canGenerate ? 1 : 0.5,
            }}
          >
            {t(locale, 'sidebar.generate')}
          </button>
          <button
            type="button"
            onMouseDown={event => event.preventDefault()}
            onClick={() => closeUpliftSidebar()}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 7,
              border: '1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14))',
              background: 'transparent',
              color: 'inherit',
              font: 'inherit',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {t(locale, 'sidebar.close')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <UpliftPanel {...props} inputActions={inputActions} variant="sidebar" />
    </div>
  )
}
