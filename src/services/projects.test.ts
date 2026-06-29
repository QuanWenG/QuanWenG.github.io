import { describe, expect, it } from 'vitest'
import { filterProjects, normalizeProjects, sortProjects } from './projects'
import type { ProjectItem } from '../types/project'

const item = (id: string, featured: boolean, weight: number, status: ProjectItem['status'] = 'active'): ProjectItem => ({
  id, name: id, description: id, url: '#', cover: '', techStack: ['React'], techIds: ['react'], category: 'tooling',
  links: [{ label: 'GitHub', url: '#', repository: id }],
  github: { stars: 0, updatedAt: '', primaryLanguage: 'TypeScript', repositories: [{ name: id, url: '#', stars: 0, updatedAt: '', primaryLanguage: 'TypeScript', archived: false }] },
  featured, weight, status,
})

describe('project data helpers', () => {
  it('sorts featured first, then weight, while keeping source order for ties', () => {
    expect(sortProjects([item('a', false, 10), item('b', true, 1), item('c', false, 20), item('d', false, 20)], false).map(({ id }) => id)).toEqual(['b', 'c', 'd', 'a'])
  })

  it('places organization projects before personal featured projects', () => {
    const organization = { ...item('org', false, 1), source: 'organization' as const }
    expect(sortProjects([item('personal', true, 100), organization], false).map(({ id }) => id)).toEqual(['org', 'personal'])
  })
  it('hides drafts only in production', () => {
    const projects = [item('draft', true, 100, 'draft'), item('live', false, 1)]
    expect(sortProjects(projects, true).map(({ id }) => id)).toEqual(['live'])
    expect(sortProjects(projects, false)).toHaveLength(2)
  })

  it('filters by category and normalized technology id', () => {
    const react = { ...item('react-app', false, 1), category: 'fullstack' as const }
    const java = { ...item('java-api', false, 1), category: 'backend' as const, techIds: ['java'] }
    expect(filterProjects([react, java], { category: 'backend', tech: 'java' }).map(({ id }) => id)).toEqual(['java-api'])
    expect(filterProjects([react, java], { category: 'all', tech: 'react' }).map(({ id }) => id)).toEqual(['react-app'])
  })

  it('supplies compatibility defaults for legacy remote project data', () => {
    const legacy = item('legacy', false, 1)
    const { category: _category, techIds: _techIds, links: _links, github: _github, ...oldShape } = legacy
    const [normalized] = normalizeProjects([oldShape])
    expect(normalized.category).toBe('tooling')
    expect(normalized.techIds).toEqual(['react'])
    expect(normalized.links).toHaveLength(1)
  })
})