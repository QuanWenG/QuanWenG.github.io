import { localDataSource } from './localDataSource'
import type { DataSource } from './dataSource'
import { normalizeProjects } from './projects'
import type { ProjectItem } from '../types/project'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

async function readRemote<T>(endpoint: string, fallback: () => Promise<T>): Promise<T> {
  if (!apiBaseUrl) return fallback()
  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`)
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)
    return (await response.json()) as T
  } catch {
    return fallback()
  }
}

export const remoteDataSource: DataSource = {
  getSiteConfig: () => readRemote('/site', localDataSource.getSiteConfig),
  getUiCopy: () => readRemote('/ui', localDataSource.getUiCopy),
  getNavigation: () => readRemote('/navigation', localDataSource.getNavigation),
  getTechStack: () => readRemote('/tech-stack', localDataSource.getTechStack),
  getProjects: async () => normalizeProjects(await readRemote<ProjectItem[]>('/projects', localDataSource.getProjects)),
  getMusicTracks: () => readRemote('/music', localDataSource.getMusicTracks),
  getAnnotations: () => readRemote('/annotations', localDataSource.getAnnotations),
  getBlogIndex: () => readRemote('/blog', localDataSource.getBlogIndex),
  getBlogArticle: (id) => readRemote(`/blog/${encodeURIComponent(id)}`, () => localDataSource.getBlogArticle(id)),
}