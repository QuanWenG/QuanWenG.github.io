import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ContentService } from '../../services'
import { useBlogLibrary } from './useBlogLibrary'

const article = {
  id: 'java/list',
  title: 'Java 集合',
  category: 'Java',
  sourcePath: 'java/list.md',
  slug: 'java/list',
  order: 0,
  content: '# Java 集合',
}

describe('useBlogLibrary', () => {
  it('resolves a deep-linked article from the loaded library', async () => {
    const service = {
      loadAppContent: vi.fn(),
      loadBlogLibrary: vi.fn(async () => ({ index: [article], articles: [article], annotations: {} })),
      getBlogArticle: vi.fn(async () => null),
    } as ContentService
    const { result } = renderHook(() => useBlogLibrary(service, 'java/list'))
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.activeArticle?.id).toBe('java/list')
    expect(service.getBlogArticle).not.toHaveBeenCalled()
  })

  it('isolates a missing direct article from the loaded catalog', async () => {
    const service = {
      loadAppContent: vi.fn(),
      loadBlogLibrary: vi.fn(async () => ({ index: [article], articles: [article], annotations: {} })),
      getBlogArticle: vi.fn(async () => null),
    } as ContentService
    const { result } = renderHook(() => useBlogLibrary(service, 'missing'))
    await waitFor(() => expect(result.current.articleStatus).toBe('error'))
    expect(result.current.status).toBe('ready')
    expect(result.current.index).toHaveLength(1)
  })
})
