import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ContentService } from '../services'
import { useAppContent } from './useAppContent'

const content = {
  site: { author: 'Q', title: { zh: '', en: '' }, subtitle: { zh: '', en: '' }, githubUrl: '', terminal: { prompt: '', welcome: [], commands: {} }, placeholders: {} },
  ui: {},
  navigation: [],
  techStack: [],
  projects: [],
  musicTracks: [],
}

describe('useAppContent', () => {
  it('exposes loading, error and retry states', async () => {
    const loadAppContent = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(content)
    const service = { loadAppContent, loadBlogLibrary: vi.fn(), getBlogArticle: vi.fn() } as ContentService
    const { result } = renderHook(() => useAppContent(service))
    await waitFor(() => expect(result.current.state.status).toBe('error'))
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.state.status).toBe('ready'))
    expect(loadAppContent).toHaveBeenCalledTimes(2)
  })
})
