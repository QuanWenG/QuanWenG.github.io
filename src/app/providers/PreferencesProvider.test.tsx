import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '../../config/storageKeys'
import { PreferencesProvider } from './PreferencesProvider'
import { usePreferences } from './usePreferences'

function UiVisibilityProbe() {
  const { uiVisibility, setUiVisibility, toggleUiVisibility } = usePreferences()
  return <div>
    <span data-testid="music-dock-state">{String(uiVisibility.musicDock)}</span>
    <span data-testid="terminal-state">{String(uiVisibility.homeTerminal)}</span>
    <span data-testid="search-state">{String(uiVisibility.techGalaxySearch)}</span>
    <span data-testid="legend-state">{String(uiVisibility.techGalaxyLegend)}</span>
    <button type="button" onClick={() => toggleUiVisibility('musicDock')}>toggle music</button>
    <button type="button" onClick={() => setUiVisibility('homeTerminal', false)}>hide terminal</button>
  </div>
}

describe('PreferencesProvider UI visibility', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('uses visible defaults and persists toggles', () => {
    render(<PreferencesProvider><UiVisibilityProbe /></PreferencesProvider>)
    expect(screen.getByTestId('music-dock-state')).toHaveTextContent('true')
    expect(screen.getByTestId('search-state')).toHaveTextContent('true')
    expect(screen.getByTestId('legend-state')).toHaveTextContent('true')
    fireEvent.click(screen.getByRole('button', { name: 'toggle music' }))
    expect(screen.getByTestId('music-dock-state')).toHaveTextContent('false')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.uiVisibility) || '{}')).toMatchObject({ musicDock: false })
  })

  it('merges saved partial visibility with defaults', () => {
    window.localStorage.setItem(STORAGE_KEYS.uiVisibility, JSON.stringify({ musicDock: false }))
    render(<PreferencesProvider><UiVisibilityProbe /></PreferencesProvider>)
    expect(screen.getByTestId('music-dock-state')).toHaveTextContent('false')
    expect(screen.getByTestId('terminal-state')).toHaveTextContent('true')
    expect(screen.getByTestId('search-state')).toHaveTextContent('true')
    fireEvent.click(screen.getByRole('button', { name: 'hide terminal' }))
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.uiVisibility) || '{}')).toMatchObject({ musicDock: false, homeTerminal: false })
  })
})
