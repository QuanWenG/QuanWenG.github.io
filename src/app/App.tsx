import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { HomePage } from '../pages/HomePage/HomePage'
import { dataSource } from '../services'
import type { NavigationItem, SiteConfig, TechStackItem, UiCopy } from '../types/content'
import type { MusicTrack } from '../types/music'
import type { ProjectItem } from '../types/project'
import { AppProviders } from './providers/AppProviders'

const BlogPage = lazy(() => import('../pages/BlogPage/BlogPage').then((module) => ({ default: module.BlogPage })))
const ProjectsPage = lazy(() => import('../pages/ProjectsPage/ProjectsPage').then((module) => ({ default: module.ProjectsPage })))
const MusicPage = lazy(() => import('../pages/MusicPage/MusicPage').then((module) => ({ default: module.MusicPage })))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

interface AppData {
  site: SiteConfig
  ui: UiCopy
  navigation: NavigationItem[]
  techStack: TechStackItem[]
  projects: ProjectItem[]
  musicTracks: MusicTrack[]
}

function LoadingScreen({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  return <div className="loading-screen" role="status">{error ? <><strong>内容暂时没有到达 / Content did not arrive</strong><button className="primary-link" type="button" onClick={onRetry}>重试 / Retry</button></> : <><span />Loading QuanWenG...</>}</div>
}

function AppRoutes({ data }: { data: AppData }) {
  const fallback = <LoadingScreen />
  return <BrowserRouter><Suspense fallback={fallback}><Routes><Route element={<AppLayout navigation={data.navigation} />}>
    <Route index element={<HomePage site={data.site} techStack={data.techStack} projects={data.projects} ui={data.ui} />} />
    <Route path="blog/*" element={<BlogPage ui={data.ui} />} />
    <Route path="projects" element={<ProjectsPage ui={data.ui} projects={data.projects} />} />
    <Route path="music" element={<MusicPage ui={data.ui} />} />
    <Route path="*" element={<NotFoundPage ui={data.ui} />} />
  </Route></Routes></Suspense></BrowserRouter>
}

function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const load = useCallback(async () => {
    setError(false)
    try {
      const [site, ui, navigation, techStack, projects, musicTracks] = await Promise.all([
        dataSource.getSiteConfig(), dataSource.getUiCopy(), dataSource.getNavigation(), dataSource.getTechStack(), dataSource.getProjects(), dataSource.getMusicTracks(),
      ])
      setData({ site, ui, navigation, techStack, projects, musicTracks })
    } catch {
      setError(true)
    }
  }, [])
  useEffect(() => { void load() }, [attempt, load])
  if (!data) return <LoadingScreen error={error} onRetry={() => setAttempt((value) => value + 1)} />
  return <AppProviders tracks={data.musicTracks}><AppRoutes data={data} /></AppProviders>
}

export default App