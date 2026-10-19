/** IME composition guard shared by the trigger and every replacement action. */
import { useEffect, useState } from 'react'

let composing = false

export function isComposingNow(): boolean {
  if (typeof document === 'undefined') return false
  if (composing) return true
  // The conversation editor also mirrors composition state into an attribute.
  return document.querySelector('[data-composer-composing]') !== null
}

export function useComposing(): boolean {
  const [state, setState] = useState<boolean>(() => isComposingNow())

  useEffect(() => {
    const onStart = (): void => {
      composing = true
      setState(true)
    }
    const onEnd = (): void => {
      composing = false
      setState(false)
    }
    document.addEventListener('compositionstart', onStart, true)
    document.addEventListener('compositionend', onEnd, true)
    return () => {
      document.removeEventListener('compositionstart', onStart, true)
      document.removeEventListener('compositionend', onEnd, true)
    }
  }, [])

  return state
}
