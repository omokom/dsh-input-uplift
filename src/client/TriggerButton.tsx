/** Tool-row trigger. Disabled for empty / non-plain / composing inputs. */
import type { ReactElement } from 'react'
import { useComposing } from './composition'
import { t, useLocale } from './i18n'
import { beginGeneration, getPreferredOptions, setActiveSession, useSessionState } from './store'
import { openUpliftSidebar } from './sidebar'
import type { InputSlotProps } from './types'

const SHORTCUT = 'Mod+Alt+U'

export function TriggerButton({ sessionId, useInput }: InputSlotProps): ReactElement {
  const locale = useLocale()
  const composing = useComposing()
  const draft = useInput(state => state.draft)
  const draftRev = useInput(state => state.draftRev)
  const phase = useInput(state => state.phase)
  const cardState = useSessionState(sessionId)

  const generating = cardState.status === 'generating'
  const empty = draft.trim() === ''
  const phaseBlocked = phase !== 'plain'
  const disabled = generating || empty || phaseBlocked || composing

  let tooltip = `${t(locale, 'trigger.title')} · ${t(locale, 'trigger.shortcut', { shortcut: SHORTCUT })}`
  if (empty) tooltip = t(locale, 'trigger.empty')
  else if (phaseBlocked) tooltip = t(locale, 'trigger.phase')
  else if (generating) tooltip = t(locale, 'trigger.busy')
  else if (composing) tooltip = t(locale, 'trigger.phase')
  const label = t(locale, 'trigger.label')

  const onClick = (): void => {
    if (disabled) return
    setActiveSession(sessionId)
    const options = getPreferredOptions(sessionId)
    beginGeneration(sessionId, draft, draftRev, options, '', true)
    if (options.displayMode === 'side') openUpliftSidebar(sessionId)
  }

  return (
    <button
      type="button"
      className="dsh-iu-trigger"
      aria-label={label}
      aria-busy={generating || undefined}
      title={tooltip}
      disabled={disabled}
      onMouseDown={event => event.preventDefault()}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 26,
        padding: '0 7px',
        border: '1px solid transparent',
        borderRadius: 'var(--dsw-radius-sm, 6px)',
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary, #b3b3b3)',
        font: 'inherit',
        fontSize: 12,
        lineHeight: '24px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true" className={generating ? 'dsh-iu-pulse' : undefined}>✦</span>
      <span>{label}</span>
    </button>
  )
}
