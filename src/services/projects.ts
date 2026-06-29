import type { ProjectCategory, ProjectItem } from '../types/project'

export interface ProjectFilters {
  category?: ProjectCategory | 'all'
  tech?: string
}

type LegacyProject = Omit<ProjectItem, 'category' | 'techIds' | 'links' | 'github'> & Partial<Pick<ProjectItem, 'category' | 'techIds' | 'links' | 'github'>>

const slugifyTech = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#]+/g, '-').replace(/^-|-$/g, '')

export function normalizeProjects(projects: LegacyProject[]): ProjectItem[] {
  return projects.map((project) => {
    const repositories = project.github?.repositories?.length ? project.github.repositories : [{
      name: project.id,
      url: project.url,
      stars: project.github?.stars || 0,
      updatedAt: project.github?.updatedAt || '',
      primaryLanguage: project.github?.primaryLanguage || project.techStack[0] || '',
      archived: project.status === 'archived',
    }]
    return {
      ...project,
      source: project.source || 'personal',
      category: project.category || 'tooling',
      techIds: project.techIds?.length ? project.techIds : project.techStack.map(slugifyTech),
      links: project.links?.length ? project.links : [{ label: 'GitHub', url: project.url, repository: project.id }],
      github: {
        stars: project.github?.stars || 0,
        updatedAt: project.github?.updatedAt || '',
        primaryLanguage: project.github?.primaryLanguage || project.techStack[0] || '',
        repositories,
      },
    }
  })
}

export function sortProjects(projects: ProjectItem[], production = import.meta.env.PROD) {
  return projects
    .map((project, index) => ({ project, index }))
    .filter(({ project }) => !production || project.status !== 'draft')
    .sort((a, b) => Number(b.project.source === 'organization') - Number(a.project.source === 'organization') || Number(b.project.featured) - Number(a.project.featured) || b.project.weight - a.project.weight || a.index - b.index)
    .map(({ project }) => project)
}

export function filterProjects(projects: ProjectItem[], filters: ProjectFilters) {
  const tech = filters.tech?.toLowerCase()
  return projects.filter((project) => {
    const categoryMatches = !filters.category || filters.category === 'all' || project.category === filters.category
    const techMatches = !tech || project.techIds.some((id) => id.toLowerCase() === tech)
    return categoryMatches && techMatches
  })
}