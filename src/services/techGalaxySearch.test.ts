import { describe, expect, it } from 'vitest'
import type { TechStackItem } from '../types/content'
import type { ProjectItem } from '../types/project'
import { createTechGalaxySearch } from './techGalaxySearch'

const project = (overrides: Partial<ProjectItem> = {}): ProjectItem => ({
  id: 'site',
  name: 'Personal Galaxy',
  description: 'A black hole portfolio with searchable technology orbits.',
  url: 'https://example.com',
  cover: '',
  techStack: ['React', 'TypeScript'],
  techIds: ['react', 'typescript'],
  category: 'fullstack',
  links: [{ label: 'Site', url: 'https://example.com', repository: 'site' }],
  github: {
    stars: 1,
    updatedAt: '2026-01-01',
    primaryLanguage: 'TypeScript',
    repositories: [{ name: 'site', url: 'https://example.com', stars: 1, updatedAt: '2026-01-01', primaryLanguage: 'TypeScript', archived: false }],
  },
  featured: true,
  weight: 1,
  status: 'active',
  ...overrides,
})

const techItem = (overrides: Partial<TechStackItem>): TechStackItem => ({
  id: 'react',
  name: 'React',
  group: 'Frontend',
  tier: 'primary',
  description: { zh: '组件化界面', en: 'Component UI' },
  color: '#61dafb',
  level: 90,
  icon: 'react',
  projectIds: ['site'],
  ...overrides,
})

describe('createTechGalaxySearch', () => {
  it('returns no results for blank queries', () => {
    const search = createTechGalaxySearch([techItem({})], [project()])
    expect(search.search('   ')).toEqual([])
  })

  it('matches exact and prefix technology fields', () => {
    const search = createTechGalaxySearch([
      techItem({}),
      techItem({ id: 'spring-boot', name: 'Spring Boot', group: 'Backend', description: { zh: 'Java 服务', en: 'Java services' } }),
    ], [project()])
    expect(search.search('React')[0]).toMatchObject({ itemId: 'react', title: 'React' })
    expect(search.search('spr')[0]).toMatchObject({ itemId: 'spring-boot' })
  })

  it('matches wildcard technology queries', () => {
    const search = createTechGalaxySearch([
      techItem({}),
      techItem({ id: 'typescript', name: 'TypeScript', group: 'Language', description: { zh: '类型边界', en: 'Type boundaries' } }),
    ], [project()])
    expect(search.search('type*')[0]).toMatchObject({ itemId: 'typescript' })
    expect(search.search('Rea?t')[0]).toMatchObject({ itemId: 'react' })
  })

  it('matches related project text to technology nodes', () => {
    const search = createTechGalaxySearch([techItem({})], [project({ name: 'Nebula Console' })])
    expect(search.search('Nebula')[0]).toMatchObject({ itemId: 'react' })
  })

  it('matches related article titles to technology nodes', () => {
    const search = createTechGalaxySearch([
      techItem({ articles: [{ title: { zh: 'React 笔记', en: 'React Notes' }, slug: 'react/notes' }] }),
    ], [project()])
    expect(search.search('笔记')[0]).toMatchObject({ itemId: 'react' })
    expect(search.search('Notes')[0]).toMatchObject({ itemId: 'react' })
  })

  it('returns a code-like completion suffix', () => {
    const search = createTechGalaxySearch([techItem({})], [project()])
    expect(search.getHint('Re')).toBe('act')
    expect(search.getHint('React')).toBe('')
  })
})

