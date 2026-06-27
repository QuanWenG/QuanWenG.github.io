import { createContext } from 'react'
import type { Locale } from '../../types/content'

export interface PreferencesContextValue {
  locale: Locale
  theme: 'light' | 'dark'
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  toggleTheme: () => void
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)
