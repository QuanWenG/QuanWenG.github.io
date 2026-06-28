import { useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '../../types/content'
import { PreferencesContext, type PreferencesContextValue } from './preferencesContext'

const THEME_KEY = 'quanweng-theme'
const LOCALE_KEY = 'quanweng-locale'

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'zh'
  return window.localStorage.getItem(LOCALE_KEY) === 'en' ? 'en' : 'zh'
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)

  const value = useMemo<PreferencesContextValue>(() => ({
    locale,
    theme,
    setLocale: (nextLocale) => {
      window.localStorage.setItem(LOCALE_KEY, nextLocale)
      setLocaleState(nextLocale)
    },
    toggleLocale: () => {
      const next = locale === 'zh' ? 'en' : 'zh'
      window.localStorage.setItem(LOCALE_KEY, next)
      setLocaleState(next)
    },
    toggleTheme: () => setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light'
      window.localStorage.setItem(THEME_KEY, next)
      return next
    }),
  }), [locale, theme])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}