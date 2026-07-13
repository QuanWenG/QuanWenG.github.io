import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PreferencesProvider } from '../../app/providers/PreferencesProvider'
import { STORAGE_KEYS } from '../../config/storageKeys'
import uiData from '../../data/ui.json'
import type { TechStackItem, UiCopy } from '../../types/content'
import type { ProjectItem } from '../../types/project'
import { TechGalaxy } from './TechGalaxy'

vi.mock('../common/useMediaQuery', () => ({
  useMediaQuery: (query: string) => query.includes('max-width'),
}))

const project: ProjectItem = {
  id: 'site', name: 'Site', description: 'Site', url: 'https://example.com', cover: '', techStack: ['React'], techIds: ['react'], category: 'fullstack',
  links: [{ label: 'Site', url: 'https://example.com', repository: 'site' }],
  github: { stars: 1, updatedAt: '2026-01-01', primaryLanguage: 'TypeScript', repositories: [{ name: 'site', url: 'https://example.com', stars: 1, updatedAt: '2026-01-01', primaryLanguage: 'TypeScript', archived: false }] },
  featured: true, weight: 1, status: 'active',
}
const item: TechStackItem = {
  id: 'react', name: 'React', group: 'Frontend', tier: 'primary', projectIds: ['site'],
  articles: [{ title: { zh: 'React 笔记', en: 'React Notes' }, slug: 'react/note' }],
  description: { zh: '组件化界面', en: 'Component UI' }, color: '#61dafb', level: 90, icon: 'react',
}

function renderGalaxy() {
  render(<MemoryRouter><PreferencesProvider><TechGalaxy items={[item]} projects={[project]} ui={uiData as UiCopy} /></PreferencesProvider></MemoryRouter>)
}

describe('TechGalaxy fallback details', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('can hide only the search overlay', () => {
    window.localStorage.setItem(STORAGE_KEYS.uiVisibility, JSON.stringify({ techGalaxySearch: false }))
    renderGalaxy()
    expect(screen.queryByRole('searchbox', { name: '搜索知识星图' })).not.toBeInTheDocument()
    expect(document.querySelector('.tech-tier-legend')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'React' })).toBeInTheDocument()
  })

  it('can hide only the orbit legend overlay', () => {
    window.localStorage.setItem(STORAGE_KEYS.uiVisibility, JSON.stringify({ techGalaxyLegend: false }))
    renderGalaxy()
    expect(screen.getByRole('searchbox', { name: '搜索知识星图' })).toBeInTheDocument()
    expect(document.querySelector('.tech-tier-legend')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'React' })).toBeInTheDocument()
  })

  it('opens related content and closes with Escape', () => {
    renderGalaxy()
    fireEvent.click(screen.getByRole('button', { name: 'React' }))
    expect(screen.getByRole('heading', { name: 'React' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Site' })).toHaveAttribute('href', 'https://example.com')
    expect(screen.getByRole('link', { name: 'React 笔记' })).toHaveAttribute('href', '/blog/react/note')
    expect(screen.getByRole('link', { name: /查看相关项目/ })).toHaveAttribute('href', '/projects')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('heading', { name: 'React' })).not.toBeInTheDocument()
  })

  it('searches related project text with Enter, opens details, and closes suggestions', () => {
    renderGalaxy()
    const searchbox = screen.getByRole('searchbox', { name: '搜索知识星图' })
    fireEvent.change(searchbox, { target: { value: 'Site' } })
    expect(document.querySelector('.tech-search__results')).toBeInTheDocument()
    fireEvent.keyDown(searchbox, { key: 'Enter' })
    expect(screen.getByRole('heading', { name: 'React' })).toBeInTheDocument()
    expect(document.querySelector('.tech-search__results')).not.toBeInTheDocument()
  })

  it('uses Enter to search the first result and ignores blank queries', () => {
    renderGalaxy()
    const searchbox = screen.getByRole('searchbox', { name: '搜索知识星图' })
    fireEvent.keyDown(searchbox, { key: 'Enter' })
    expect(screen.queryByRole('heading', { name: 'React' })).not.toBeInTheDocument()
    fireEvent.change(searchbox, { target: { value: 'React' } })
    fireEvent.keyDown(searchbox, { key: 'Enter' })
    expect(screen.getByRole('heading', { name: 'React' })).toBeInTheDocument()
  })

  it('focuses the search input when the left side of the field is pressed', () => {
    renderGalaxy()
    const searchbox = screen.getByRole('searchbox', { name: '搜索知识星图' })
    const field = document.querySelector('.tech-search__field') as HTMLElement
    fireEvent.mouseDown(field)
    expect(searchbox).toHaveFocus()
  })

  it('clears search text without opening details', () => {
    renderGalaxy()
    const searchbox = screen.getByRole('searchbox', { name: '搜索知识星图' })
    fireEvent.change(searchbox, { target: { value: 'React' } })
    fireEvent.click(screen.getByRole('button', { name: '清空搜索' }))
    expect(searchbox).toHaveValue('')
    expect(screen.queryByRole('heading', { name: 'React' })).not.toBeInTheDocument()
  })
})
