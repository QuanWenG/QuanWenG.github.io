import { describe, expect, it } from 'vitest'
import { buildContentIndex } from './contentIndex'
import type { ProjectItem } from '../types/project'

const project: ProjectItem = {
  id: 'project', name: 'Project', description: 'Build', url: '#', cover: '', techStack: ['React'], techIds: ['react'], category: 'fullstack',
  links: [{ label: 'Frontend', url: '#', repository: 'project-front' }],
  github: { stars: 2, updatedAt: '2026-01-01', primaryLanguage: 'TypeScript', repositories: [{ name: 'project-front', url: '#', stars: 2, updatedAt: '2026-01-01', primaryLanguage: 'TypeScript', archived: false }] },
  featured: true, weight: 1, status: 'active',
}

describe('buildContentIndex', () => {
  it('combines all supported content kinds and repository metadata', () => {
    const result = buildContentIndex(
      [{ id: 'note', title: 'Note', category: 'Java', sourcePath: 'note.md', slug: 'note', order: 0 }],
      [project],
      [{ id: 'track', title: 'Track', artist: 'Artist', src: 'track.mp3', cover: '', accentColor: '#fff', tags: ['music'] }],
      [{ id: 'react', name: 'React', group: 'web', tier: 'primary', projectIds: ['project'], description: { zh: '界面', en: 'UI' }, color: '#fff', level: 1 }],
    )
    expect(new Set(result.map(({ kind }) => kind))).toEqual(new Set(['blog', 'project', 'music', 'technology']))
    expect(result.find(({ id }) => id === 'project:project')?.searchableText).toContain('project-front')
    expect(result.find(({ id }) => id === 'technology:react')?.searchableText).toContain('primary')
  })
})