import type { ProjectItem } from '../types/project'

export function sortProjects(projects: ProjectItem[], production = import.meta.env.PROD) {
  return projects
    .map((project, index) => ({ project, index }))
    .filter(({ project }) => !production || project.status !== 'draft')
    .sort((a, b) => Number(b.project.featured) - Number(a.project.featured) || b.project.weight - a.project.weight || a.index - b.index)
    .map(({ project }) => project)
}