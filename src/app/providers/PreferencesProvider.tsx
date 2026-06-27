import { useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '../../types/content'
import { PreferencesContext, type PreferencesContextValue } from './preferencesContext'

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('zh')
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)

  const value = useMemo<PreferencesContextValue>(() => {
    return {
      locale,
      theme,
      setLocale,
      toggleLocale: () => setLocale((current) => (current === 'zh' ? 'en' : 'zh')),
      toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    }
  }, [locale, theme])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
