import { useEffect, type ReactNode } from 'react'
import { usePreferences } from './usePreferences'

export function ThemeSync({ children }: { children: ReactNode }) {
  const { locale, theme } = usePreferences()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    document.documentElement.style.colorScheme = theme
  }, [locale, theme])
  return children
}