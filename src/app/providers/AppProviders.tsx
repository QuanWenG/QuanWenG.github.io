import { PreferencesProvider } from './PreferencesProvider'
import { ThemeSync } from './ThemeSync'
import type { ReactNode } from 'react'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <ThemeSync>{children}</ThemeSync>
    </PreferencesProvider>
  )
}
