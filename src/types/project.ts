export type ProjectStatus = 'active' | 'archived' | 'draft'
export type ProjectSource = 'personal' | 'organization'
export type ProjectCategory = 'ai' | 'fullstack' | 'backend' | 'plugin' | 'game' | 'tooling'

export interface ProjectLink {
  label: string
  url: string
  repository: string
}

export interface ProjectRepositoryMeta {
  owner?: string
  name: string
  url: string
  stars: number
  updatedAt: string
  primaryLanguage: string
  archived: boolean
}

export interface ProjectGitHubMeta {
  stars: number
  updatedAt: string
  primaryLanguage: string
  repositories: ProjectRepositoryMeta[]
}

export interface ProjectItem {
  id: string
  name: string
  description: string
  url: string
  cover: string
  techStack: string[]
  techIds: string[]
  category: ProjectCategory
  links: ProjectLink[]
  github: ProjectGitHubMeta
  featured: boolean
  weight: number
  status: ProjectStatus
  source?: ProjectSource
}