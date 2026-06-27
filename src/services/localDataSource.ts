import annotations from '../data/annotations.json'
import musicTracks from '../data/music.json'
import navigation from '../data/navigation.json'
import projects from '../data/projects.json'
import siteConfig from '../data/site.json'
import techStack from '../data/tech-stack.json'
import type { DataSource } from './dataSource'
import type { TechStackItem } from '../types/content'
import type { ProjectItem } from '../types/project'

export const localDataSource: DataSource = {
  getSiteConfig: async () => siteConfig,
  getNavigation: async () => navigation,
  getTechStack: async () => techStack as TechStackItem[],
  getProjects: async () => projects as ProjectItem[],
  getMusicTracks: async () => musicTracks,
  getAnnotations: async () => annotations,
}


