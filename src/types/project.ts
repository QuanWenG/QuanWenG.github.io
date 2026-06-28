export type ProjectStatus = 'active' | 'archived' | 'draft'

export interface ProjectItem {
  id: string
  name: string
  description: string
  url: string
  cover: string
  techStack: string[]
  featured: boolean
  weight: number
  status: ProjectStatus
}