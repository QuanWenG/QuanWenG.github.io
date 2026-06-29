import type { BlogArticle, BlogArticleMeta } from '../types/blog'
import type { AnnotationMap, NavigationItem, SiteConfig, TechStackItem, UiCopy } from '../types/content'
import type { MusicTrack } from '../types/music'
import type { ProjectItem } from '../types/project'
import type { DataSource } from './dataSource'

export interface AppContent {
  site: SiteConfig
  ui: UiCopy
  navigation: NavigationItem[]
  techStack: TechStackItem[]
  projects: ProjectItem[]
  musicTracks: MusicTrack[]
}

export interface BlogLibrary {
  index: BlogArticleMeta[]
  articles: BlogArticle[]
  annotations: AnnotationMap
}

export interface ContentService {
  loadAppContent: () => Promise<AppContent>
  loadBlogLibrary: () => Promise<BlogLibrary>
  getBlogArticle: (id: string) => Promise<BlogArticle | null>
}

export function createContentService(source: DataSource): ContentService {
  return {
    async loadAppContent() {
      const [site, ui, navigation, techStack, projects, musicTracks] = await Promise.all([
        source.getSiteConfig(),
        source.getUiCopy(),
        source.getNavigation(),
        source.getTechStack(),
        source.getProjects(),
        source.getMusicTracks(),
      ])
      return { site, ui, navigation, techStack, projects, musicTracks }
    },
    async loadBlogLibrary() {
      const [index, annotations] = await Promise.all([
        source.getBlogIndex(),
        source.getAnnotations(),
      ])
      const articles = (await Promise.all(index.map(({ id }) => source.getBlogArticle(id))))
        .filter((article): article is BlogArticle => article !== null)
      return { index, articles, annotations }
    },
    getBlogArticle: (id) => source.getBlogArticle(id),
  }
}
