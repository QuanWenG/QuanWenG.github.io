import { createContext } from 'react'
import type { Locale } from '../../types/content'

export type UiVisibilityKey = 'musicDock' | 'homeTerminal' | 'scrollCue' | 'techGalaxySearch' | 'techGalaxyLegend'
export type UiVisibility = Record<UiVisibilityKey, boolean>

export const DEFAULT_UI_VISIBILITY: UiVisibility = {
  musicDock: true,
  homeTerminal: true,
  scrollCue: true,
  techGalaxySearch: true,
  techGalaxyLegend: true,
}

export interface PreferencesContextValue {
  locale: Locale
  theme: 'light' | 'dark'
  uiVisibility: UiVisibility
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  toggleTheme: () => void
  setUiVisibility: (key: UiVisibilityKey, visible: boolean) => void
  toggleUiVisibility: (key: UiVisibilityKey) => void
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)
