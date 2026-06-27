import type { AnnotationMap, NavigationItem, SiteConfig, TechStackItem } from '../types/content'
import type { MusicTrack } from '../types/music'
import type { ProjectItem } from '../types/project'

export interface DataSource {
  getSiteConfig: () => Promise<SiteConfig>
  getNavigation: () => Promise<NavigationItem[]>
  getTechStack: () => Promise<TechStackItem[]>
  getProjects: () => Promise<ProjectItem[]>
  getMusicTracks: () => Promise<MusicTrack[]>
  getAnnotations: () => Promise<AnnotationMap>
}
