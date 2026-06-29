import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PreferencesProvider } from '../../app/providers/PreferencesProvider'
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

describe('TechGalaxy fallback details', () => {
  afterEach(cleanup)

  it('opens related content and closes with Escape', () => {
    render(<MemoryRouter><PreferencesProvider><TechGalaxy items={[item]} projects={[project]} ui={uiData as UiCopy} /></PreferencesProvider></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'React' }))
    expect(screen.getByRole('heading', { name: 'React' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Site' })).toHaveAttribute('href', 'https://example.com')
    expect(screen.getByRole('link', { name: 'React 笔记' })).toHaveAttribute('href', '/blog/react/note')
    expect(screen.getByRole('link', { name: /查看相关项目/ })).toHaveAttribute('href', '/projects')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('heading', { name: 'React' })).not.toBeInTheDocument()
  })
})