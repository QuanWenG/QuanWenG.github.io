import { useMemo, useState, type ReactNode } from 'react'
import { MEDIA_QUERIES } from '../../config/mediaQueries'
import { STORAGE_KEYS } from '../../config/storageKeys'
import type { Locale } from '../../types/content'
import { DEFAULT_UI_VISIBILITY, PreferencesContext, type PreferencesContextValue, type UiVisibility, type UiVisibilityKey } from './preferencesContext'

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

function getInitialUiVisibility(): UiVisibility {
  if (typeof window === 'undefined') return DEFAULT_UI_VISIBILITY
  const saved = window.localStorage.getItem(STORAGE_KEYS.uiVisibility)
  if (!saved) return DEFAULT_UI_VISIBILITY
  try {
    const parsed = JSON.parse(saved) as Partial<Record<UiVisibilityKey, unknown>>
    return Object.fromEntries(Object.entries(DEFAULT_UI_VISIBILITY).map(([key, fallback]) => {
      const typedKey = key as UiVisibilityKey
      return [key, typeof parsed[typedKey] === 'boolean' ? parsed[typedKey] : fallback]
    })) as UiVisibility
  } catch {
    return DEFAULT_UI_VISIBILITY
  }
}

function persistUiVisibility(nextVisibility: UiVisibility) {
  window.localStorage.setItem(STORAGE_KEYS.uiVisibility, JSON.stringify(nextVisibility))
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)
  const [uiVisibility, setUiVisibilityState] = useState<UiVisibility>(getInitialUiVisibility)

  const value = useMemo<PreferencesContextValue>(() => ({
    locale,
    theme,
    uiVisibility,
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
    setUiVisibility: (key, visible) => setUiVisibilityState((current) => {
      const next = { ...current, [key]: visible }
      persistUiVisibility(next)
      return next
    }),
    toggleUiVisibility: (key) => setUiVisibilityState((current) => {
      const next = { ...current, [key]: !current[key] }
      persistUiVisibility(next)
      return next
    }),
  }), [locale, theme, uiVisibility])

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
