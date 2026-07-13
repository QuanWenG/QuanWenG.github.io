import { describe, expect, it, vi } from 'vitest'
import type { ContentIndexEntry, SiteConfig } from '../../types/content'
import type { MusicTrack } from '../../types/music'
import {
  getQuanWenGTerminalSuggestions,
  parseQuanWenGTerminalCommand,
  runQuanWenGTerminalCommand,
  searchContentIndex,
  type QuanWenGTerminalCommandContext,
} from './QuanWenGTerminalCommands'

const track: MusicTrack = {
  id: 'night-drive',
  title: 'Night Drive',
  artist: 'QuanWenG',
  src: '/music/night.mp3',
  cover: '',
  accentColor: '#89f7fe',
  tags: ['ambient'],
}

const site: SiteConfig = {
  author: 'Q',
  title: { zh: '站点', en: 'Site' },
  subtitle: { zh: '', en: '' },
  githubUrl: 'https://github.com/QuanWenG',
  terminal: {
    prompt: 'q@site:~$',
    welcome: [],
    commands: {
      about: { zh: '这里是测试站点。', en: 'This is a test site.' },
      unknown: { zh: '没有找到这个命令，试试 help。', en: 'Command not found. Try help.' },
    },
  },
  placeholders: {},
}

const contentIndex: ContentIndexEntry[] = [
  {
    id: 'blog:react-note',
    kind: 'blog',
    title: 'React Notes',
    description: 'Frontend article',
    href: '/blog/react-note',
    tags: ['react', 'frontend'],
    searchableText: 'React hooks frontend',
  },
  {
    id: 'project:site',
    kind: 'project',
    title: 'Personal Site',
    description: 'React portfolio',
    href: 'https://example.com/site',
    tags: ['react', 'portfolio'],
    searchableText: 'site react vite portfolio',
  },
  {
    id: 'music:night-drive',
    kind: 'music',
    title: 'Night Drive',
    description: 'QuanWenG',
    href: '/music',
    tags: ['ambient'],
    searchableText: 'Night Drive ambient QuanWenG',
  },
  {
    id: 'technology:react',
    kind: 'technology',
    title: 'React',
    description: 'Component UI',
    href: '/#tech-stack',
    tags: ['frontend', 'primary'],
    searchableText: 'react component ui frontend primary',
  },
]

function createContext(overrides: Partial<QuanWenGTerminalCommandContext> = {}): QuanWenGTerminalCommandContext {
  return {
    locale: 'zh',
    site,
    navigation: [],
    contentIndex,
    lastSearchResults: [],
    locationPathname: '/',
    navigate: vi.fn(),
    scrollToTechStack: vi.fn(),
    openExternal: vi.fn(),
    preferences: {
      theme: 'light',
      locale: 'zh',
      setLocale: vi.fn(),
      toggleLocale: vi.fn(),
      toggleTheme: vi.fn(),
    },
    music: {
      tracks: [track],
      currentTrack: track,
      isPlaying: false,
      volume: 1,
      repeatMode: 'all',
      togglePlay: vi.fn(),
      previous: vi.fn(),
      next: vi.fn(),
      setVolume: vi.fn(),
      toggleRepeat: vi.fn(),
    },
    ...overrides,
  }
}

describe('QuanWenG terminal commands', () => {
  it('parses quoted arguments without requiring slashes', () => {
    expect(parseQuanWenGTerminalCommand('search "computer networks"')).toMatchObject({
      normalizedCommand: 'search',
      args: ['computer networks'],
    })
  })

  it('shows global help and focused command help', () => {
    const context = createContext()
    expect(runQuanWenGTerminalCommand('help', context).lines?.[0].text).toContain('可用命令')
    expect(runQuanWenGTerminalCommand('help cd', context).lines?.[0].text).toContain('cd <home|tech|blog|projects|music>')
    expect(runQuanWenGTerminalCommand('help help', context).lines?.[0].text).toContain('不需要二级帮助')
    expect(runQuanWenGTerminalCommand('help nope', context).lines?.[0].kind).toBe('error')
  })

  it('resolves cd aliases and routes the tech anchor through scrolling on home', () => {
    const scrollToTechStack = vi.fn()
    const navigate = vi.fn()
    runQuanWenGTerminalCommand('cd 技术栈', createContext({ scrollToTechStack, navigate }))
    expect(scrollToTechStack).toHaveBeenCalledOnce()
    expect(navigate).not.toHaveBeenCalled()

    runQuanWenGTerminalCommand('cd projects', createContext({ navigate }))
    expect(navigate).toHaveBeenCalledWith('/projects')
  })

  it('suggests command prefixes and argument prefixes without requiring spaces', () => {
    const context = createContext()
    expect(getQuanWenGTerminalSuggestions('/', context).map(({ input }) => input)).toContain('help')
    expect(getQuanWenGTerminalSuggestions('/c', context).map(({ input }) => input)).toContain('cd')
    expect(getQuanWenGTerminalSuggestions('c', context).map(({ input }) => input)).toContain('cd')
    const helpInputs = getQuanWenGTerminalSuggestions('help', context).map(({ input }) => input)
    expect(helpInputs).toContain('help cd')
    expect(helpInputs).not.toContain('help help')
    expect(getQuanWenGTerminalSuggestions('cd', context).map(({ input }) => input)).toContain('cd tech')
    expect(getQuanWenGTerminalSuggestions('music', context).map(({ input }) => input)).toContain('music play')
    expect(getQuanWenGTerminalSuggestions('cd 技', context).map(({ input }) => input)).toContain('cd tech')
  })

  it('searches all content kinds and stores no results for blank queries', () => {
    expect(searchContentIndex(contentIndex, '')).toEqual([])
    const results = searchContentIndex(contentIndex, 'react')
    expect(new Set(results.map(({ kind }) => kind))).toEqual(new Set(['blog', 'project', 'technology']))

    const executed = runQuanWenGTerminalCommand('search react', createContext())
    expect(executed.searchResults?.map(({ id }) => id)).toContain('technology:react')
    expect(executed.lines?.some((entry) => entry.command === 'open 1')).toBe(true)
  })

  it('opens prior search results and external links through the expected channel', () => {
    const openExternal = vi.fn()
    const navigate = vi.fn()
    runQuanWenGTerminalCommand('open 2', createContext({ lastSearchResults: contentIndex, openExternal, navigate }))
    expect(openExternal).toHaveBeenCalledWith('https://example.com/site')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('validates music volume boundaries', () => {
    const setVolume = vi.fn()
    const invalid = runQuanWenGTerminalCommand('music volume 120', createContext({ music: { ...createContext().music, setVolume } }))
    expect(invalid.lines?.[0].kind).toBe('error')
    expect(setVolume).not.toHaveBeenCalled()

    runQuanWenGTerminalCommand('music volume 55', createContext({ music: { ...createContext().music, setVolume } }))
    expect(setVolume).toHaveBeenCalledWith(0.55)
  })
})
