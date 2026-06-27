import { useEffect, type ReactNode } from 'react'
import { usePreferences } from './usePreferences'

export function ThemeSync({ children }: { children: ReactNode }) {
  const { theme } = usePreferences()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return children
}

