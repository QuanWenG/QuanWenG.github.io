export const API_ENDPOINTS = {
  site: '/site',
  ui: '/ui',
  navigation: '/navigation',
  techStack: '/tech-stack',
  projects: '/projects',
  projectSourceConfig: '/projects/source-config',
  music: '/music',
  annotations: '/annotations',
  blogIndex: '/blog',
  profile: '/profile',
  login: '/auth/login',
  blogArticle: (id: string) => `/blog/${encodeURIComponent(id)}`,
} as const