import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { OWNER_AUTH_CONFIG } from '../../config/auth'
import type { AppContent, ContentService } from '../../services'
import { useContentWorkspace } from './contentWorkspaceContext'
import { ContentWorkspaceProvider } from './ContentWorkspaceProvider'

const content: AppContent = {
  site: {
    author: 'QuanWenG',
    title: { zh: '站点', en: 'Site' },
    subtitle: { zh: '简介', en: 'Intro' },
    githubUrl: 'https://github.com/QuanWenG',
    terminal: { prompt: '$', welcome: [], commands: {} },
    placeholders: {},
  },
  ui: {},
  navigation: [],
  techStack: [],
  projects: [],
  projectSourceConfig: { owner: 'QuanWenG', projects: [] },
  musicTracks: [],
  blogIndex: [],
}

const service: ContentService = {
  loadAppContent: vi.fn(async () => content),
  loadBlogLibrary: vi.fn(async () => ({ index: [], articles: [], annotations: {} })),
  getBlogArticle: vi.fn(async () => null),
}

function wrapper({ children }: { children: ReactNode }) {
  return <ContentWorkspaceProvider initialContent={content} contentService={service}>{children}</ContentWorkspaceProvider>
}

describe('ContentWorkspaceProvider session overlay', () => {
  it('guards owner actions and publishes session-only content', () => {
    const { result, unmount } = renderHook(() => useContentWorkspace(), { wrapper })

    expect(result.current.role).toBe('visitor')
    expect(result.current.user.name).toBe('登录')
    expect(() => result.current.publishContent('tech', {
      name: 'Rust', group: 'Language', descriptionZh: '系统语言', descriptionEn: 'Systems language', color: '#dea584', level: 70, tier: 'learning',
    })).toThrow(/Owner permission/)

    act(() => {
      expect(result.current.loginOwner({ username: OWNER_AUTH_CONFIG.username, password: OWNER_AUTH_CONFIG.password })).toBe(true)
    })
    expect(result.current.role).toBe('owner')

    act(() => {
      result.current.saveDraft('tech', {
        name: 'Rust', group: 'Language', descriptionZh: '系统语言', descriptionEn: 'Systems language', color: '#dea584', level: 70, tier: 'learning',
      })
    })
    expect(result.current.drafts).toHaveLength(1)
    expect(result.current.content.techStack).toHaveLength(0)

    act(() => {
      result.current.publishDraft(result.current.drafts[0].id)
    })
    expect(result.current.drafts).toHaveLength(0)
    expect(result.current.published).toHaveLength(1)
    expect(result.current.content.techStack.map((item) => item.name)).toEqual(['Rust'])

    unmount()
    const fresh = renderHook(() => useContentWorkspace(), { wrapper })
    expect(fresh.result.current.role).toBe('visitor')
    expect(fresh.result.current.content.techStack).toHaveLength(0)
  })

  it('merges published blog articles and annotations into the overlay content service', async () => {
    const { result } = renderHook(() => useContentWorkspace(), { wrapper })
    act(() => {
      result.current.loginOwner({ username: OWNER_AUTH_CONFIG.username, password: OWNER_AUTH_CONFIG.password })
    })
    act(() => {
      result.current.publishContent('blog', { title: 'Session Note', category: 'Drafts', content: '# Session Note' })
    })
    const sourcePath = result.current.content.blogIndex[0].sourcePath
    act(() => {
      result.current.publishContent('annotation', { articleId: 'Drafts/Session Note', sourcePath, blockId: 'b-paragraph-1', content: 'session note' })
    })

    const library = await result.current.contentService.loadBlogLibrary()
    expect(library.index.map((article) => article.title)).toEqual(['Session Note'])
    expect(library.articles[0].content).toContain('# Session Note')
    expect(library.annotations[sourcePath]['b-paragraph-1'][0].content).toBe('session note')
  })
})