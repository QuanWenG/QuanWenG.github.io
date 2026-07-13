import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PreferencesProvider } from '../../app/providers/PreferencesProvider'
import { STORAGE_KEYS } from '../../config/storageKeys'
import navigationData from '../../data/navigation.json'
import uiData from '../../data/ui.json'
import type { NavigationItem, UiCopy } from '../../types/content'
import { TopNavigation } from './TopNavigation'

function renderNav() {
  render(<MemoryRouter><PreferencesProvider><TopNavigation items={navigationData as NavigationItem[]} ui={uiData as UiCopy} /></PreferencesProvider></MemoryRouter>)
}

describe('TopNavigation settings popover', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('opens display settings and toggles visibility switches', () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: '显示设置' }))
    expect(screen.getByRole('dialog', { name: '显示设置' })).toBeInTheDocument()
    const musicSwitch = screen.getByRole('switch', { name: /全局音乐盒/ })
    const searchSwitch = screen.getByRole('switch', { name: /星图搜索框/ })
    const legendSwitch = screen.getByRole('switch', { name: /星图轨道图例/ })
    expect(musicSwitch).toHaveAttribute('aria-checked', 'true')
    expect(searchSwitch).toHaveAttribute('aria-checked', 'true')
    expect(legendSwitch).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(musicSwitch)
    fireEvent.click(searchSwitch)
    expect(musicSwitch).toHaveAttribute('aria-checked', 'false')
    expect(searchSwitch).toHaveAttribute('aria-checked', 'false')
    expect(legendSwitch).toHaveAttribute('aria-checked', 'true')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEYS.uiVisibility) || '{}')).toMatchObject({ musicDock: false, techGalaxySearch: false, techGalaxyLegend: true })
  })

  it('closes settings with Escape and outside pointer input', () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: '显示设置' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: '显示设置' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '显示设置' }))
    expect(screen.getByRole('dialog', { name: '显示设置' })).toBeInTheDocument()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('dialog', { name: '显示设置' })).not.toBeInTheDocument()
  })
})
