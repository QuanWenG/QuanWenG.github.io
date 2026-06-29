import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import type { NavigationItem } from '../../types/content'
import { MusicDock } from '../music/MusicDock'
import { TopNavigation } from './TopNavigation'

export function AppLayout({ navigation }: { navigation: NavigationItem[] }) {
  const location = useLocation()
  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.hash, location.pathname])
  return <div className="app-shell"><TopNavigation items={navigation} /><main><Outlet /></main><MusicDock /></div>
}