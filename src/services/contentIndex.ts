import type { BlogArticleMeta } from '../types/blog'
import type { ContentIndexEntry, TechStackItem } from '../types/content'
import type { MusicTrack } from '../types/music'
import type { ProjectItem } from '../types/project'

export function buildContentIndex(
  blog: BlogArticleMeta[],
  projects: ProjectItem[],
  music: MusicTrack[],
  techStack: TechStackItem[],
): ContentIndexEntry[] {
  return [
    ...blog.map((article) => ({
      id: `blog:${article.id}`,
      kind: 'blog' as const,
      title: article.title,
      description: article.category,
      href: `/blog/${article.slug}`,
      tags: [article.category],
      searchableText: `${article.title} ${article.category}`,
    })),
    ...projects.map((project) => ({
      id: `project:${project.id}`,
      kind: 'project' as const,
      title: project.name,
      description: project.description,
      href: project.url,
      tags: project.techStack,
      searchableText: `${project.name} ${project.description} ${project.techStack.join(' ')}`,
    })),
    ...music.map((track) => ({
      id: `music:${track.id}`,
      kind: 'music' as const,
      title: track.title,
      description: track.artist,
      href: '/music',
      tags: track.tags,
      searchableText: `${track.title} ${track.artist} ${track.tags.join(' ')}`,
    })),
    ...techStack.map((item) => ({
      id: `technology:${item.id}`,
      kind: 'technology' as const,
      title: item.name,
      description: item.description.zh,
      href: '/#tech-stack',
      tags: [item.group],
      searchableText: `${item.name} ${item.group} ${item.description.zh} ${item.description.en}`,
    })),
  ]
}