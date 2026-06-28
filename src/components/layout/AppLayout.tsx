import { Outlet } from 'react-router-dom'
import type { NavigationItem } from '../../types/content'
import { MusicDock } from '../music/MusicDock'
import { TopNavigation } from './TopNavigation'

export function AppLayout({ navigation }: { navigation: NavigationItem[] }) {
  return <div className="app-shell"><TopNavigation items={navigation} /><main><Outlet /></main><MusicDock /></div>
}