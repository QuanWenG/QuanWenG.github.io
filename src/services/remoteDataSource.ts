import { localDataSource } from './localDataSource'
import type { DataSource } from './dataSource'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')

async function readRemote<T>(endpoint: string, fallback: () => Promise<T>): Promise<T> {
  if (!apiBaseUrl) {
    return fallback()
  }

  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`)
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }
    return (await response.json()) as T
  } catch {
    return fallback()
  }
}

export const remoteDataSource: DataSource = {
  getSiteConfig: () => readRemote('/site', localDataSource.getSiteConfig),
  getNavigation: () => readRemote('/navigation', localDataSource.getNavigation),
  getTechStack: () => readRemote('/tech-stack', localDataSource.getTechStack),
  getProjects: () => readRemote('/projects', localDataSource.getProjects),
  getMusicTracks: () => readRemote('/music', localDataSource.getMusicTracks),
  getAnnotations: () => readRemote('/annotations', localDataSource.getAnnotations),
}
