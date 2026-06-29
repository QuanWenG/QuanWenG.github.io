export const API_ENDPOINTS = {
  site: '/site',
  ui: '/ui',
  navigation: '/navigation',
  techStack: '/tech-stack',
  projects: '/projects',
  music: '/music',
  annotations: '/annotations',
  blogIndex: '/blog',
  blogArticle: (id: string) => `/blog/${encodeURIComponent(id)}`,
} as const
