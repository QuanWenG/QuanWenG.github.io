import { useMemo, useState, type ReactNode } from 'react'
import { MEDIA_QUERIES } from '../../config/mediaQueries'
import { STORAGE_KEYS } from '../../config/storageKeys'
import type { Locale } from '../../types/content'
import { PreferencesContext, type PreferencesContextValue } from './preferencesContext'

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(STORAGE_KEYS.theme)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia(MEDIA_QUERIES.prefersDarkColorScheme).matches ? 'dark' : 'light'
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'zh'
  return window.localStorage.getItem(STORAGE_KEYS.locale) === 'en' ? 'en' : 'zh'
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)

  const value = useMemo<PreferencesContextValue>(() => ({
    locale,
    theme,
    setLocale: (nextLocale) => {
      window.localStorage.setItem(STORAGE_KEYS.locale, nextLocale)
      setLocaleState(nextLocale)
    },
    toggleLocale: () => {
      const next = locale === 'zh' ? 'en' : 'zh'
      window.localStorage.setItem(STORAGE_KEYS.locale, next)
      setLocaleState(next)
    },
    toggleTheme: () => setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light'
      window.localStorage.setItem(STORAGE_KEYS.theme, next)
      return next
    }),
  }), [locale, theme])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}