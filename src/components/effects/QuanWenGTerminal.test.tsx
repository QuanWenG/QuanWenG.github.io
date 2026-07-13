import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { PreferencesProvider } from '../../app/providers/PreferencesProvider'
import { MusicContext, type MusicContextValue } from '../music/musicContext'
import type { ContentIndexEntry, NavigationItem, SiteConfig } from '../../types/content'
import { QuanWenGTerminal } from './QuanWenGTerminal'

const site: SiteConfig = {
  author: 'Q',
  title: { zh: '站点', en: 'Site' },
  subtitle: { zh: '', en: '' },
  githubUrl: 'https://github.com/QuanWenG',
  terminal: {
    prompt: 'q@site:~$',
    welcome: [{ zh: '输入 help。', en: 'Type help.' }],
    commands: {
      about: { zh: '这里是测试站点。', en: 'This is a test site.' },
      unknown: { zh: '没有找到这个命令，试试 help。', en: 'Command not found. Try help.' },
    },
  },
  placeholders: {},
}

const navigation: NavigationItem[] = [
  { id: 'home', label: { zh: '首页', en: 'Home' }, path: '/', showInNav: true },
  { id: 'tech', label: { zh: '技术栈', en: 'Stack' }, path: '/', anchor: 'tech-stack', showInNav: true },
  { id: 'projects', label: { zh: '项目', en: 'Projects' }, path: '/projects', showInNav: true },
]

const contentIndex: ContentIndexEntry[] = [
  {
    id: 'technology:react',
    kind: 'technology',
    title: 'React',
    description: 'Component UI',
    href: '/#tech-stack',
    tags: ['frontend'],
    searchableText: 'react component ui frontend',
  },
  {
    id: 'blog:react-note',
    kind: 'blog',
    title: 'React Notes',
    description: 'Frontend article',
    href: '/blog/react-note',
    tags: ['react'],
    searchableText: 'react hooks',
  },
]

const musicValue: MusicContextValue = {
  tracks: [{ id: 'track', title: 'Track', artist: 'Artist', src: '/track.mp3', cover: '', accentColor: '#fff', tags: ['ambient'] }],
  currentTrack: { id: 'track', title: 'Track', artist: 'Artist', src: '/track.mp3', cover: '', accentColor: '#fff', tags: ['ambient'] },
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  repeatMode: 'all',
  energy: 0,
  spectrum: [0, 0, 0, 0, 0],
  error: null,
  playTrack: vi.fn(),
  togglePlay: vi.fn(),
  previous: vi.fn(),
  next: vi.fn(),
  seek: vi.fn(),
  setVolume: vi.fn(),
  toggleRepeat: vi.fn(),
}

function LocationProbe({ onChange }: { onChange: (path: string) => void }) {
  const location = useLocation()
  useEffect(() => {
    onChange(`${location.pathname}${location.hash}`)
  }, [location.hash, location.pathname, onChange])
  return null
}

function renderTerminal(onLocationChange = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/']}>
      <PreferencesProvider>
        <MusicContext.Provider value={musicValue}>
          <QuanWenGTerminal site={site} navigation={navigation} contentIndex={contentIndex} />
          <div id="tech-stack" />
          <LocationProbe onChange={onLocationChange} />
        </MusicContext.Provider>
      </PreferencesProvider>
    </MemoryRouter>,
  )
  return screen.getByRole('combobox', { name: 'Terminal command' }) as HTMLInputElement
}

function submit(input: HTMLInputElement, value: string) {
  fireEvent.change(input, { target: { value } })
  fireEvent.submit(input.closest('form') as HTMLFormElement)
}

describe('QuanWenGTerminal', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders help output and focused command help', () => {
    const input = renderTerminal()
    submit(input, 'help')
    expect(screen.getByText(/可用命令/)).toBeInTheDocument()

    submit(input, 'help cd')
    expect(screen.getByText(/cd <home\|tech\|blog\|projects\|music> -/)).toBeInTheDocument()
  })

  it('navigates with cd and scrolls to the tech stack anchor on home', () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
    const onLocationChange = vi.fn()
    const input = renderTerminal(onLocationChange)

    submit(input, 'cd tech')
    expect(scrollIntoView).toHaveBeenCalledOnce()

    submit(input, 'cd projects')
    expect(onLocationChange).toHaveBeenLastCalledWith('/projects')

    submit(input, 'cd tech')
    expect(onLocationChange).toHaveBeenLastCalledWith('/#tech-stack')
  })

  it('shows suggestions, completes with Tab, cycles candidates, and closes with Escape', () => {
    const input = renderTerminal()
    fireEvent.change(input, { target: { value: 'c' } })
    expect(screen.getByRole('listbox', { name: '命令建议' })).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveValue('cd')
    expect(screen.getByRole('listbox', { name: '命令建议' })).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveValue('cd home')

    fireEvent.keyDown(input, { key: 'Tab' })
    expect(input).toHaveValue('cd tech')

    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true })
    expect(input).toHaveValue('cd home')

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox', { name: '命令建议' })).not.toBeInTheDocument()
  })

  it('scrolls the suggestion list when arrow keys change the active item', () => {
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView })
    const input = renderTerminal()

    fireEvent.change(input, { target: { value: 'cd' } })
    scrollIntoView.mockClear()

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(screen.getByRole('option', { name: /cd tech/ })).toHaveAttribute('aria-selected', 'true')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })

    scrollIntoView.mockClear()
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(screen.getByRole('option', { name: /cd home/ })).toHaveAttribute('aria-selected', 'true')
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
  })

  it('closes suggestions when focus leaves or a suggestion is clicked', () => {
    const input = renderTerminal()
    fireEvent.change(input, { target: { value: 'c' } })
    fireEvent.blur(input)
    expect(screen.queryByRole('listbox', { name: '命令建议' })).not.toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'cd' } })
    fireEvent.click(screen.getByRole('option', { name: /cd tech/ }))
    expect(input).toHaveValue('cd tech')
    expect(screen.queryByRole('listbox', { name: '命令建议' })).not.toBeInTheDocument()
  })

  it('focuses the terminal input with Ctrl+L', () => {
    const input = renderTerminal()
    input.blur()
    fireEvent.keyDown(window, { key: 'l', ctrlKey: true })
    expect(input).toHaveFocus()
  })

  it('searches content and opens the first result from the keyboard flow', () => {
    const onLocationChange = vi.fn()
    const input = renderTerminal(onLocationChange)

    submit(input, 'search react')
    expect(screen.getByText(/找到 2 个结果/)).toBeInTheDocument()
    expect(screen.getByText(/1\. React/)).toBeInTheDocument()

    submit(input, 'open 1')
    expect(onLocationChange).toHaveBeenLastCalledWith('/#tech-stack')
  })
})
