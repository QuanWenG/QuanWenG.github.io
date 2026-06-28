import { describe, expect, it } from 'vitest'
import { buildContentIndex } from './contentIndex'

describe('buildContentIndex', () => {
  it('combines all supported content kinds', () => {
    const result = buildContentIndex(
      [{ id: 'note', title: 'Note', category: 'Java', sourcePath: 'note.md', slug: 'note', order: 0 }],
      [{ id: 'project', name: 'Project', description: 'Build', url: '#', cover: '', techStack: ['React'], featured: true, weight: 1, status: 'active' }],
      [{ id: 'track', title: 'Track', artist: 'Artist', src: 'track.mp3', cover: '', accentColor: '#fff', tags: ['music'] }],
      [{ id: 'react', name: 'React', group: 'web', description: { zh: '界面', en: 'UI' }, color: '#fff', level: 1 }],
    )
    expect(new Set(result.map(({ kind }) => kind))).toEqual(new Set(['blog', 'project', 'music', 'technology']))
  })
})