import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PreferencesProvider } from '../../app/providers/PreferencesProvider'
import { STORAGE_KEYS } from '../../config/storageKeys'
import uiData from '../../data/ui.json'
import type { UiCopy } from '../../types/content'
import { AppLayout } from './AppLayout'

vi.mock('../music/MusicDock', () => ({
  MusicDock: () => <div data-testid="music-dock" />,
}))

vi.mock('./TopNavigation', () => ({
  TopNavigation: () => <nav data-testid="top-nav" />,
}))

function renderLayout() {
  render(<MemoryRouter initialEntries={['/']}><PreferencesProvider><Routes><Route element={<AppLayout navigation={[]} ui={uiData as UiCopy} />}><Route path="/" element={<div>Page</div>} /></Route></Routes></PreferencesProvider></MemoryRouter>)
}

describe('AppLayout UI visibility', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('renders the music dock by default', () => {
    renderLayout()
    expect(screen.getByTestId('music-dock')).toBeInTheDocument()
  })

  it('does not render the music dock when it is disabled', () => {
    window.localStorage.setItem(STORAGE_KEYS.uiVisibility, JSON.stringify({ musicDock: false }))
    renderLayout()
    expect(screen.queryByTestId('music-dock')).not.toBeInTheDocument()
  })
})
