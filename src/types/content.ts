import type { BlogArticleMeta } from './blog'

export type Locale = 'zh' | 'en'

export interface LocalizedText {
  zh: string
  en: string
}

export interface SiteConfig {
  author: string
  title: LocalizedText
  subtitle: LocalizedText
  githubUrl: string
  terminal: {
    prompt: string
    welcome: LocalizedText[]
    commands: Record<string, LocalizedText>
  }
  placeholders: Record<string, LocalizedText>
}

export interface NavigationItem {
  id: string
  label: LocalizedText
  path: string
  anchor?: string
  showInNav: boolean
}

export type TechTier = 'primary' | 'supporting' | 'learning'

export interface TechArticleLink {
  title: LocalizedText
  slug: string
}

export interface TechStackItem {
  id: string
  name: string
  group: string
  description: LocalizedText
  color: string
  level: number
  tier?: TechTier
  projectIds?: string[]
  articles?: TechArticleLink[]
  icon?: string
  iconSource?: string
  stellarType?: 'normal' | 'pulsar' | 'blueGiant' | 'redDwarf' | 'whiteDwarf'
  orbitRadius?: number
  size?: number
  glow?: number
  positionBias?: [number, number, number]
}

export interface AnnotationItem {
  id: string
  content: string
}

export type AnnotationMap = Record<string, Record<string, AnnotationItem[]>>
export type UiCopy = Record<string, LocalizedText>
export type ContentKind = 'blog' | 'project' | 'music' | 'technology'

export interface ContentIndexEntry {
  id: string
  kind: ContentKind
  title: string
  description: string
  href: string
  tags: string[]
  searchableText: string
}

export type BlogIndex = BlogArticleMeta[]