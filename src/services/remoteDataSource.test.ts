import { describe, expect, it, vi } from 'vitest'
import type { DataSource } from './dataSource'
import { createRemoteDataSource } from './remoteDataSource'

function createFallback(): DataSource {
  return {
    getSiteConfig: vi.fn(async () => ({ author: 'local', title: { zh: '', en: '' }, subtitle: { zh: '', en: '' }, githubUrl: '', terminal: { prompt: '', welcome: [], commands: {} }, placeholders: {} })),
    getUiCopy: vi.fn(async () => ({})),
    getNavigation: vi.fn(async () => []),
    getTechStack: vi.fn(async () => []),
    getProjects: vi.fn(async () => []),
    getMusicTracks: vi.fn(async () => []),
    getAnnotations: vi.fn(async () => ({})),
    getBlogIndex: vi.fn(async () => []),
    getBlogArticle: vi.fn(async () => null),
  }
}

describe('createRemoteDataSource', () => {
  it('uses injected fetch and normalizes the base URL', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ author: 'remote' }), { status: 200 })) as unknown as typeof fetch
    const source = createRemoteDataSource({ baseUrl: 'https://api.example.com/', fallback: createFallback(), fetcher })
    await expect(source.getSiteConfig()).resolves.toMatchObject({ author: 'remote' })
    expect(fetcher).toHaveBeenCalledWith('https://api.example.com/site')
  })

  it('falls back per endpoint and encodes article identifiers', async () => {
    const fallback = createFallback()
    const fetcher = vi.fn(async () => { throw new Error('offline') }) as unknown as typeof fetch
    const source = createRemoteDataSource({ baseUrl: 'https://api.example.com', fallback, fetcher })
    await source.getBlogArticle('java/集合')
    expect(fetcher).toHaveBeenCalledWith('https://api.example.com/blog/java%2F%E9%9B%86%E5%90%88')
    expect(fallback.getBlogArticle).toHaveBeenCalledWith('java/集合')
  })
})
