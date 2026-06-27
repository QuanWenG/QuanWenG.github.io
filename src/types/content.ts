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

export interface TechStackItem {
  id: string
  name: string
  group: string
  description: LocalizedText
  color: string
  level: number
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
