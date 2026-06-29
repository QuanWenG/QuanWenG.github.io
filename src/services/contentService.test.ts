import { describe, expect, it, vi } from 'vitest'
import type { DataSource } from './dataSource'
import { createContentService } from './contentService'

function createSource(): DataSource {
  return {
    getSiteConfig: vi.fn(async () => ({ author: 'Q', title: { zh: '站点', en: 'Site' }, subtitle: { zh: '', en: '' }, githubUrl: '', terminal: { prompt: '', welcome: [], commands: {} }, placeholders: {} })),
    getUiCopy: vi.fn(async () => ({})),
    getNavigation: vi.fn(async () => []),
    getTechStack: vi.fn(async () => []),
    getProjects: vi.fn(async () => []),
    getMusicTracks: vi.fn(async () => []),
    getAnnotations: vi.fn(async () => ({})),
    getBlogIndex: vi.fn(async () => [
      { id: 'one', title: 'One', category: 'Notes', sourcePath: 'one.md', slug: 'one', order: 0 },
      { id: 'missing', title: 'Missing', category: 'Notes', sourcePath: 'missing.md', slug: 'missing', order: 1 },
    ]),
    getBlogArticle: vi.fn(async (id) => id === 'one'
      ? { id, title: 'One', category: 'Notes', sourcePath: 'one.md', slug: 'one', order: 0, content: '# One' }
      : null),
  }
}

describe('ContentService', () => {
  it('loads application content through one facade call', async () => {
    const source = createSource()
    const content = await createContentService(source).loadAppContent()
    expect(content.site.author).toBe('Q')
    expect(source.getProjects).toHaveBeenCalledOnce()
    expect(source.getMusicTracks).toHaveBeenCalledOnce()
  })

  it('keeps the blog library usable when one indexed article is missing', async () => {
    const library = await createContentService(createSource()).loadBlogLibrary()
    expect(library.index).toHaveLength(2)
    expect(library.articles.map(({ id }) => id)).toEqual(['one'])
  })

  it('propagates final source errors to the application boundary', async () => {
    const source = createSource()
    vi.mocked(source.getSiteConfig).mockRejectedValueOnce(new Error('unavailable'))
    await expect(createContentService(source).loadAppContent()).rejects.toThrow('unavailable')
  })
})
