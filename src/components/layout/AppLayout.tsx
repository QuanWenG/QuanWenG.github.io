import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import type { NavigationItem, UiCopy } from '../../types/content'
import { MusicDock } from '../music/MusicDock'
import { TopNavigation } from './TopNavigation'

export function AppLayout({ navigation, ui }: { navigation: NavigationItem[]; ui: UiCopy }) {
  const location = useLocation()
  const { uiVisibility } = usePreferences()
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.hash, location.pathname])
  return <div className="app-shell"><TopNavigation items={navigation} ui={ui} /><main><Outlet /></main>{uiVisibility.musicDock && <MusicDock />}</div>
}
