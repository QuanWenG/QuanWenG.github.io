import type { ProjectItem } from '../types/project'
import { API_ENDPOINTS } from './apiEndpoints'
import type { DataSource } from './dataSource'
import { normalizeProjects } from './projects'

export interface RemoteDataSourceOptions {
  baseUrl: string
  fallback: DataSource
  fetcher?: typeof fetch
}

export function createRemoteDataSource({
  baseUrl,
  fallback,
  fetcher = fetch,
}: RemoteDataSourceOptions): DataSource {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')

  async function readRemote<T>(endpoint: string, readFallback: () => Promise<T>): Promise<T> {
    try {
      const response = await fetcher(`${normalizedBaseUrl}${endpoint}`)
      if (!response.ok) throw new Error(`Request failed: ${response.status}`)
      return (await response.json()) as T
    } catch {
      // 远程接口是可替换的数据细节；不可用时由同一能力的本地实现兜底。
      return readFallback()
    }
  }

  return {
    getSiteConfig: () => readRemote(API_ENDPOINTS.site, fallback.getSiteConfig),
    getUiCopy: () => readRemote(API_ENDPOINTS.ui, fallback.getUiCopy),
    getNavigation: () => readRemote(API_ENDPOINTS.navigation, fallback.getNavigation),
    getTechStack: () => readRemote(API_ENDPOINTS.techStack, fallback.getTechStack),
    getProjects: async () => normalizeProjects(await readRemote<ProjectItem[]>(API_ENDPOINTS.projects, fallback.getProjects)),
    getMusicTracks: () => readRemote(API_ENDPOINTS.music, fallback.getMusicTracks),
    getAnnotations: () => readRemote(API_ENDPOINTS.annotations, fallback.getAnnotations),
    getBlogIndex: () => readRemote(API_ENDPOINTS.blogIndex, fallback.getBlogIndex),
    getBlogArticle: (id) => readRemote(API_ENDPOINTS.blogArticle(id), () => fallback.getBlogArticle(id)),
  }
}