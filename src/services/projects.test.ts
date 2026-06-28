import { describe, expect, it } from 'vitest'
import { sortProjects } from './projects'
import type { ProjectItem } from '../types/project'

const item = (id: string, featured: boolean, weight: number, status: ProjectItem['status'] = 'active'): ProjectItem => ({ id, name: id, description: id, url: '#', cover: '', techStack: [], featured, weight, status })

describe('sortProjects', () => {
  it('sorts featured first, then weight, while keeping source order for ties', () => {
    expect(sortProjects([item('a', false, 10), item('b', true, 1), item('c', false, 20), item('d', false, 20)], false).map(({ id }) => id)).toEqual(['b', 'c', 'd', 'a'])
  })
  it('hides drafts only in production', () => {
    const projects = [item('draft', true, 100, 'draft'), item('live', false, 1)]
    expect(sortProjects(projects, true).map(({ id }) => id)).toEqual(['live'])
    expect(sortProjects(projects, false)).toHaveLength(2)
  })
})