import type { BlogArticle, BlogArticleMeta } from '../types/blog'
import type { AnnotationMap, NavigationItem, SiteConfig, TechStackItem, UiCopy } from '../types/content'
import type { MusicTrack } from '../types/music'
import type { ProjectItem } from '../types/project'

export interface DataSource {
  getSiteConfig: () => Promise<SiteConfig>
  getUiCopy: () => Promise<UiCopy>
  getNavigation: () => Promise<NavigationItem[]>
  getTechStack: () => Promise<TechStackItem[]>
  getProjects: () => Promise<ProjectItem[]>
  getMusicTracks: () => Promise<MusicTrack[]>
  getAnnotations: () => Promise<AnnotationMap>
  getBlogIndex: () => Promise<BlogArticleMeta[]>
  getBlogArticle: (id: string) => Promise<BlogArticle | null>
}