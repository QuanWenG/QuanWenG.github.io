import annotations from '../data/annotations.json'
import musicTracks from '../data/music.json'
import navigation from '../data/navigation.json'
import projectSourceConfig from '../data/projects.config.json'
import projects from '../data/projects.json'
import siteConfig from '../data/site.json'
import techStack from '../data/tech-stack.json'
import uiCopy from '../data/ui.json'
import type { AnnotationMap, TechStackItem, UiCopy } from '../types/content'
import type { MusicTrack } from '../types/music'
import type { ProjectItem } from '../types/project'
import type { ProjectSourceConfig } from '../types/workspace'
import { getLocalBlogArticle, getLocalBlogIndex } from './blogContent'
import type { DataSource } from './dataSource'
import { normalizeProjects } from './projects'

export const localDataSource: DataSource = {
  getSiteConfig: async () => siteConfig,
  getUiCopy: async () => uiCopy as UiCopy,
  getNavigation: async () => navigation,
  getTechStack: async () => techStack as TechStackItem[],
  getProjects: async () => normalizeProjects(projects as ProjectItem[]),
  getProjectSourceConfig: async () => projectSourceConfig as ProjectSourceConfig,
  getMusicTracks: async () => musicTracks as MusicTrack[],
  getAnnotations: async () => annotations as AnnotationMap,
  getBlogIndex: async () => getLocalBlogIndex(),
  getBlogArticle: async (id) => getLocalBlogArticle(id),
}