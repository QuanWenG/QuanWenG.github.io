import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { APP_ROUTES } from '../config/routes'
import { HomePage } from '../pages/HomePage/HomePage'
import type { AppContent, ContentService } from '../services'
import { AppProviders } from './providers/AppProviders'
import { useAppContent } from './useAppContent'

const BlogPage = lazy(() => import('../pages/BlogPage/BlogPage').then((module) => ({ default: module.BlogPage })))
const ProjectsPage = lazy(() => import('../pages/ProjectsPage/ProjectsPage').then((module) => ({ default: module.ProjectsPage })))
const MusicPage = lazy(() => import('../pages/MusicPage/MusicPage').then((module) => ({ default: module.MusicPage })))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

function LoadingScreen({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  return <div className="loading-screen" role="status">{error ? <><strong>内容暂时没有到达 / Content did not arrive</strong><button className="primary-link" type="button" onClick={onRetry}>重试 / Retry</button></> : <><span />Loading QuanWenG...</>}</div>
}

function AppRoutes({ data, contentService }: { data: AppContent; contentService: ContentService }) {
  const fallback = <LoadingScreen />
  return <BrowserRouter><Suspense fallback={fallback}><Routes><Route element={<AppLayout navigation={data.navigation} />}>
    <Route index element={<HomePage site={data.site} techStack={data.techStack} projects={data.projects} ui={data.ui} />} />
    <Route path={`${APP_ROUTES.blog}/*`} element={<BlogPage ui={data.ui} contentService={contentService} />} />
    <Route path={APP_ROUTES.projects} element={<ProjectsPage ui={data.ui} projects={data.projects} />} />
    <Route path={APP_ROUTES.music} element={<MusicPage ui={data.ui} />} />
    <Route path="*" element={<NotFoundPage ui={data.ui} />} />
  </Route></Routes></Suspense></BrowserRouter>
}

function App({ contentService }: { contentService: ContentService }) {
  const { state, retry } = useAppContent(contentService)
  if (state.status !== 'ready') return <LoadingScreen error={state.status === 'error'} onRetry={retry} />
  return <AppProviders tracks={state.data.musicTracks}><AppRoutes data={state.data} contentService={contentService} /></AppProviders>
}

export default App