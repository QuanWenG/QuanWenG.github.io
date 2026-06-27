import { CornerDownRight } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import { textByLocale } from '../../services/i18n'
import type { SiteConfig } from '../../types/content'

interface HeroTerminalProps {
  site: SiteConfig
}

export function HeroTerminal({ site }: HeroTerminalProps) {
  const { locale } = usePreferences()
  const navigate = useNavigate()
  const welcomeText = useMemo(() => {
    return site.terminal.welcome.map((line) => textByLocale(line, locale)).join(' ')
  }, [locale, site.terminal.welcome])
  const [typedText, setTypedText] = useState('')
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    setTypedText('')
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setTypedText(welcomeText.slice(0, index))
      if (index >= welcomeText.length) {
        window.clearInterval(timer)
      }
    }, 26)

    return () => window.clearInterval(timer)
  }, [welcomeText])

  const pushHistory = (line: string) => {
    setHistory((current) => [...current, line].slice(-2))
  }

  const runCommand = (command: string) => {
    const normalized = command.trim().toLowerCase()
    if (!normalized) {
      return
    }

    if (normalized === 'clear') {
      setHistory([])
      return
    }

    if (normalized === 'projects') {
      pushHistory(textByLocale(site.terminal.commands.projects, locale))
      navigate('/projects')
      return
    }

    if (normalized === 'music') {
      pushHistory(textByLocale(site.terminal.commands.music, locale))
      navigate('/music')
      return
    }

    const message = site.terminal.commands[normalized] || site.terminal.commands.unknown
    pushHistory(textByLocale(message, locale))
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runCommand(input)
    setInput('')
  }

  return (
    <div className="hero-terminal" aria-label="Interactive terminal">
      <div className="hero-terminal__bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="hero-terminal__line">
        <span>{site.terminal.prompt}</span> {typedText}
      </p>
      <form className="hero-terminal__form" onSubmit={submit}>
        <CornerDownRight size={14} aria-hidden="true" />
        <label className="sr-only" htmlFor="terminal-command">
          Terminal command
        </label>
        <input
          id="terminal-command"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="help"
          autoComplete="off"
        />
      </form>
      {history.map((line, index) => (
        <p className="hero-terminal__output" key={`${line}-${index}`}>
          {line}
        </p>
      ))}
    </div>
  )
}
