/**
 * Bridge to the DSH right-sidebar tab registered by the client entry.
 * The services are only available inside `ctx.inject`; the entry publishes a
 * tiny face on `globalThis` so ordinary components can open/close the tab.
 */

export const SIDEBAR_TAB_ID = '@local/dsh-input-uplift'
export const SIDEBAR_TAB_KIND = 'input-uplift'

interface SidebarTabFace {
  openTab: (sessionId: string) => void
  closeActive: () => void
  isAvailable: () => boolean
}

function face(): SidebarTabFace | undefined {
  return (globalThis as unknown as { __iuSidebar?: SidebarTabFace }).__iuSidebar
}

export function openUpliftSidebar(sessionId: string): boolean {
  const api = face()
  if (api === undefined) return false
  try {
    api.openTab(sessionId)
    return true
  } catch {
    return false
  }
}

/** Close the right-sidebar tab (used when the user switches back to overlay). */
export function closeUpliftSidebar(): void {
  const api = face()
  if (api === undefined) return
  try {
    api.closeActive()
  } catch {
    // Nothing to close is a normal state.
  }
}

export function upliftSidebarAvailable(): boolean {
  return face() !== undefined
}
