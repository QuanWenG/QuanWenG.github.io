import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import { APP_ROUTES, TECH_STACK_ANCHOR_ID, TECH_STACK_ROUTE } from '../../config/routes'
import { textByLocale } from '../../services/i18n'
import type { ContentIndexEntry, NavigationItem, SiteConfig } from '../../types/content'
import { useMusicPlayer } from '../music/useMusicPlayer'
import {
  getQuanWenGTerminalSuggestions,
  runQuanWenGTerminalCommand,
  type QuanWenGTerminalCommandContext,
  type QuanWenGTerminalOutputLine,
  type QuanWenGTerminalSuggestion,
} from './QuanWenGTerminalCommands'

const TERMINAL_TYPING_INTERVAL_MS = 26
const TERMINAL_HISTORY_LIMIT = 8

interface TerminalHistoryEntry extends QuanWenGTerminalOutputLine {
  id: string
}

interface QuanWenGTerminalProps {
  site: SiteConfig
  navigation: NavigationItem[]
  contentIndex: ContentIndexEntry[]
}

export function QuanWenGTerminal({ site, navigation, contentIndex }: QuanWenGTerminalProps) {
  const preferences = usePreferences()
  const { locale } = preferences
  const player = useMusicPlayer()
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionOptionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const shouldScrollActiveSuggestionRef = useRef(false)
  const suppressNextFocusSuggestionsRef = useRef(false)
  const outputIdRef = useRef(0)
  const suggestionsId = useId()
  const welcomeText = useMemo(() => {
    return site.terminal.welcome.map((line) => textByLocale(line, locale)).join(' ')
  }, [locale, site.terminal.welcome])
  const [typedText, setTypedText] = useState('')
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<TerminalHistoryEntry[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [, setHistoryCursor] = useState<number | null>(null)
  const [lastSearchResults, setLastSearchResults] = useState<ContentIndexEntry[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(0)
  const [pinnedSuggestions, setPinnedSuggestions] = useState<QuanWenGTerminalSuggestion[] | null>(null)

  useEffect(() => {
    setTypedText('')
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setTypedText(welcomeText.slice(0, index))
      if (index >= welcomeText.length) window.clearInterval(timer)
    }, TERMINAL_TYPING_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [welcomeText])

  const scrollToTechStack = useCallback(() => {
    if (location.pathname !== APP_ROUTES.home) {
      navigate(TECH_STACK_ROUTE)
      return
    }
    document.getElementById(TECH_STACK_ANCHOR_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.pathname, navigate])

  const openExternal = useCallback((href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer')
  }, [])

  const commandContext = useMemo<QuanWenGTerminalCommandContext>(() => ({
    locale,
    site,
    navigation,
    contentIndex,
    lastSearchResults,
    locationPathname: location.pathname,
    navigate,
    scrollToTechStack,
    openExternal,
    preferences: {
      theme: preferences.theme,
      locale: preferences.locale,
      setLocale: preferences.setLocale,
      toggleLocale: preferences.toggleLocale,
      toggleTheme: preferences.toggleTheme,
    },
    music: {
      tracks: player.tracks,
      currentTrack: player.currentTrack,
      isPlaying: player.isPlaying,
      volume: player.volume,
      repeatMode: player.repeatMode,
      togglePlay: player.togglePlay,
      previous: player.previous,
      next: player.next,
      setVolume: player.setVolume,
      toggleRepeat: player.toggleRepeat,
    },
  }), [contentIndex, lastSearchResults, locale, location.pathname, navigate, navigation, openExternal, player, preferences, scrollToTechStack, site])

  const suggestions = useMemo(() => getQuanWenGTerminalSuggestions(input, commandContext), [commandContext, input])
  const visibleSuggestions = pinnedSuggestions ?? suggestions
  const activeSuggestion = visibleSuggestions[suggestionIndex] || visibleSuggestions[0]
  const activeSuggestionId = suggestionsOpen && activeSuggestion ? `${suggestionsId}-${activeSuggestion.id}` : undefined

  useEffect(() => {
    setSuggestionIndex((current) => Math.min(current, Math.max(visibleSuggestions.length - 1, 0)))
    suggestionOptionRefs.current.length = visibleSuggestions.length
  }, [visibleSuggestions.length])

  useEffect(() => {
    if (!suggestionsOpen || !visibleSuggestions.length || !shouldScrollActiveSuggestionRef.current) return
    shouldScrollActiveSuggestionRef.current = false
    suggestionOptionRefs.current[suggestionIndex]?.scrollIntoView?.({ block: 'nearest' })
  }, [suggestionIndex, suggestionsOpen, visibleSuggestions.length])

  useEffect(() => {
    const focusTerminal = (event: globalThis.KeyboardEvent) => {
      const key = event.key.toLocaleLowerCase()
      const terminalShortcut = (event.ctrlKey && key === 'l') || ((event.metaKey || event.ctrlKey) && key === 'k')
      if (!terminalShortcut) return
      event.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
      setPinnedSuggestions(null)
      setSuggestionsOpen(Boolean(inputRef.current?.value.trim()))
    }
    window.addEventListener('keydown', focusTerminal)
    return () => window.removeEventListener('keydown', focusTerminal)
  }, [])

  const pushHistory = useCallback((lines: QuanWenGTerminalOutputLine[]) => {
    setHistory((current) => [
      ...current,
      ...lines.map((line) => {
        outputIdRef.current += 1
        return { ...line, id: `terminal-output-${outputIdRef.current}` }
      }),
    ].slice(-TERMINAL_HISTORY_LIMIT))
  }, [])

  const runCommand = useCallback((command: string) => {
    const trimmed = command.trim()
    if (!trimmed) return
    const result = runQuanWenGTerminalCommand(trimmed, commandContext)
    if (result.status === 'noop') return
    setCommandHistory((current) => [...current.filter((item) => item !== trimmed), trimmed].slice(-20))
    setHistoryCursor(null)
    setSuggestionsOpen(false)
    setPinnedSuggestions(null)
    if (result.status === 'clear') {
      setHistory([])
      setLastSearchResults([])
      return
    }
    if (result.searchResults) setLastSearchResults(result.searchResults)
    if (result.lines?.length) pushHistory(result.lines)
  }, [commandContext, pushHistory])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runCommand(input)
    setInput('')
    setSuggestionsOpen(false)
    setPinnedSuggestions(null)
  }

  const completeSuggestion = (reverse: boolean) => {
    if (!visibleSuggestions.length) return
    const selected = visibleSuggestions[suggestionIndex] || visibleSuggestions[0]
    const sameInput = input.trim().toLocaleLowerCase() === selected.input.trim().toLocaleLowerCase()
    const nextIndex = sameInput
      ? (suggestionIndex + (reverse ? -1 : 1) + visibleSuggestions.length) % visibleSuggestions.length
      : suggestionIndex
    const nextSuggestion = visibleSuggestions[nextIndex] || selected
    shouldScrollActiveSuggestionRef.current = true
    setSuggestionIndex(nextIndex)
    setInput(nextSuggestion.input)
    setPinnedSuggestions((pinnedSuggestions || nextSuggestion.input.trim().includes(' ')) ? visibleSuggestions : null)
    setSuggestionsOpen(true)
  }

  const recallCommand = (direction: -1 | 1) => {
    if (!commandHistory.length) return
    setHistoryCursor((current) => {
      if (current === null) {
        const index = direction === -1 ? commandHistory.length - 1 : 0
        setInput(commandHistory[index])
        return index
      }
      const next = current + direction
      if (next < 0) {
        setInput(commandHistory[0])
        return 0
      }
      if (next >= commandHistory.length) {
        setInput('')
        return null
      }
      setInput(commandHistory[next])
      return next
    })
    setSuggestionsOpen(false)
    setPinnedSuggestions(null)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey && event.key.toLocaleLowerCase() === 'u') {
      event.preventDefault()
      setInput('')
      setSuggestionsOpen(false)
      setPinnedSuggestions(null)
      return
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      completeSuggestion(event.shiftKey)
      return
    }

    if (event.key === 'ArrowDown') {
      if (suggestionsOpen && visibleSuggestions.length) {
        event.preventDefault()
        shouldScrollActiveSuggestionRef.current = true
        setSuggestionIndex((current) => (current + 1) % visibleSuggestions.length)
        return
      }
      event.preventDefault()
      recallCommand(1)
      return
    }

    if (event.key === 'ArrowUp') {
      if (suggestionsOpen && visibleSuggestions.length) {
        event.preventDefault()
        shouldScrollActiveSuggestionRef.current = true
        setSuggestionIndex((current) => (current - 1 + visibleSuggestions.length) % visibleSuggestions.length)
        return
      }
      event.preventDefault()
      recallCommand(-1)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      if (suggestionsOpen) {
        setSuggestionsOpen(false)
        setPinnedSuggestions(null)
      } else setInput('')
    }
  }

  const selectSuggestion = (value: string) => {
    setInput(value)
    setSuggestionsOpen(false)
    setPinnedSuggestions(null)
    suppressNextFocusSuggestionsRef.current = true
    inputRef.current?.focus()
  }

  return (
    <div className="quanweng-terminal" aria-label="Interactive terminal" onBlur={(event) => {
      const nextFocus = event.relatedTarget as Node | null
      if (!nextFocus || !event.currentTarget.contains(nextFocus)) {
        setSuggestionsOpen(false)
        setPinnedSuggestions(null)
      }
    }}>
      <p className="quanweng-terminal__line">
        <span>{site.terminal.prompt}</span> {typedText}
      </p>
      <div className="quanweng-terminal__outputs" aria-live="polite">
        {history.map((item) => (
          <p className={`quanweng-terminal__output quanweng-terminal__output--${item.kind}`} key={item.id}>
            <span>{item.text}</span>
            {item.command ? <code>{item.command}</code> : null}
          </p>
        ))}
      </div>
      <div className="quanweng-terminal__command">
        <form className="quanweng-terminal__form" onSubmit={submit}>
          <label className="sr-only" htmlFor="terminal-command">
            Terminal command
          </label>
          <input
            ref={inputRef}
            id="terminal-command"
            value={input}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={suggestionsOpen && visibleSuggestions.length > 0}
            aria-controls={suggestionsOpen && visibleSuggestions.length ? suggestionsId : undefined}
            aria-activedescendant={activeSuggestionId}
            onChange={(event) => {
              const nextValue = event.target.value
              setInput(nextValue)
              setSuggestionIndex(0)
              setPinnedSuggestions(null)
              setSuggestionsOpen(Boolean(nextValue.trim()))
              setHistoryCursor(null)
            }}
            onFocus={() => {
              if (suppressNextFocusSuggestionsRef.current) {
                suppressNextFocusSuggestionsRef.current = false
                return
              }
              setSuggestionsOpen(Boolean(input.trim()))
            }}
            onKeyDown={handleKeyDown}
            placeholder="help"
            autoComplete="off"
          />
        </form>
        {suggestionsOpen && visibleSuggestions.length > 0 ? (
          <div className="quanweng-terminal__suggestions" id={suggestionsId} role="listbox" aria-label={locale === 'zh' ? '命令建议' : 'Command suggestions'}>
            {visibleSuggestions.map((suggestion, index) => (
              <button
                ref={(node) => {
                  suggestionOptionRefs.current[index] = node
                }}
                className={index === suggestionIndex ? 'quanweng-terminal__suggestion is-active' : 'quanweng-terminal__suggestion'}
                id={`${suggestionsId}-${suggestion.id}`}
                key={suggestion.id}
                type="button"
                role="option"
                aria-selected={index === suggestionIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion.input)}
              >
                <strong>{suggestion.input}</strong>
                <small>{suggestion.detail}</small>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
