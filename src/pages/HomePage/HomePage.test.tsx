import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PreferencesProvider } from '../../app/providers/PreferencesProvider'
import { STORAGE_KEYS } from '../../config/storageKeys'
import navigationData from '../../data/navigation.json'
import projectsData from '../../data/projects.json'
import siteData from '../../data/site.json'
import techStackData from '../../data/tech-stack.json'
import uiData from '../../data/ui.json'
import type { ContentIndexEntry, NavigationItem, SiteConfig, TechStackItem, UiCopy } from '../../types/content'
import type { ProjectItem } from '../../types/project'
import { HomePage } from './HomePage'

vi.mock('../../components/common/ScrollCue', () => ({
  ScrollCue: () => <div data-testid="scroll-cue" />,
}))

vi.mock('../../components/effects/GridWaveBackground', () => ({
  GridWaveBackground: () => <div data-testid="grid-wave" />,
}))

vi.mock('../../components/effects/QuanWenGTerminal', () => ({
  QuanWenGTerminal: () => <div data-testid="home-terminal" />,
}))

vi.mock('../../components/effects/TechGalaxy', () => ({
  TechGalaxy: () => <div data-testid="tech-galaxy" />,
}))

const contentIndex: ContentIndexEntry[] = []

function renderHome() {
  render(<MemoryRouter><PreferencesProvider><HomePage site={siteData as SiteConfig} navigation={navigationData as NavigationItem[]} techStack={techStackData as TechStackItem[]} projects={projectsData as ProjectItem[]} contentIndex={contentIndex} ui={uiData as UiCopy} /></PreferencesProvider></MemoryRouter>)
}

describe('HomePage UI visibility', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('shows terminal and scroll cue by default', () => {
    renderHome()
    expect(screen.getByTestId('home-terminal')).toBeInTheDocument()
    expect(screen.getByTestId('scroll-cue')).toBeInTheDocument()
  })

  it('hides terminal and scroll cue when disabled', () => {
    window.localStorage.setItem(STORAGE_KEYS.uiVisibility, JSON.stringify({ homeTerminal: false, scrollCue: false }))
    renderHome()
    expect(screen.queryByTestId('home-terminal')).not.toBeInTheDocument()
    expect(screen.queryByTestId('scroll-cue')).not.toBeInTheDocument()
  })
})
