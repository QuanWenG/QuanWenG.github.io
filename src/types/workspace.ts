import type { BlogArticle } from './blog'
import type { TechStackItem, TechTier } from './content'
import type { MusicTrack } from './music'
import type { ProjectCategory, ProjectItem, ProjectStatus } from './project'

export type UserRole = 'visitor' | 'owner'
export type WorkspaceContentKind = 'tech' | 'blog' | 'annotation' | 'project' | 'music'
export type WorkspaceRecordStatus = 'draft' | 'published'

export interface SessionUser {
  role: UserRole
  name: string
  avatarInitial: string
}

export interface UserProfile {
  displayName: string
  headline: string
  bio: string
  location: string
  githubUrl: string
}

export interface OwnerLoginInput {
  username: string
  password: string
}

export interface TechStackDraft {
  name: string
  group: string
  descriptionZh: string
  descriptionEn: string
  color: string
  level: number
  tier: TechTier
}

export interface BlogArticleDraft {
  title: string
  category: string
  content: string
}

export interface AnnotationDraft {
  articleId: string
  sourcePath: string
  blockId: string
  content: string
}

export interface ProjectDraft {
  name: string
  description: string
  url: string
  category: ProjectCategory
  techStack: string[]
  techIds: string[]
  cover: string
  featured: boolean
  weight: number
  status: ProjectStatus
  linkLabel: string
}

export interface MusicTrackDraft {
  title: string
  artist: string
  src: string
  cover: string
  duration?: number
  accentColor: string
  tags: string[]
}

export type WorkspaceDraftPayload = TechStackDraft | BlogArticleDraft | AnnotationDraft | ProjectDraft | MusicTrackDraft

export interface WorkspaceRecord {
  id: string
  kind: WorkspaceContentKind
  status: WorkspaceRecordStatus
  title: string
  targetId?: string
  createdAt: string
  updatedAt: string
  payload: WorkspaceDraftPayload
}

export interface ProjectSourceRepositoryConfig {
  owner?: string
  name: string
  label: string
}

export interface ProjectSourceProjectConfig {
  id: string
  name: string
  description: string
  repositories: ProjectSourceRepositoryConfig[]
  category: ProjectCategory
  techIds: string[]
  techStack: string[]
  cover: string
  featured: boolean
  weight: number
  status?: ProjectStatus
}

export interface ProjectSourceConfig {
  owner: string
  projects: ProjectSourceProjectConfig[]
}

export interface PublishedWorkspaceContent {
  techStack: TechStackItem[]
  blogArticles: BlogArticle[]
  annotations: Record<string, Record<string, Array<{ id: string; content: string }>>>
  projects: ProjectItem[]
  musicTracks: MusicTrack[]
}