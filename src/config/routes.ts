export const APP_ROUTES = {
  home: '/',
  blog: '/blog',
  projects: '/projects',
  music: '/music',
} as const

export const TECH_STACK_ANCHOR_ID = 'tech-stack'
export const TECH_STACK_ROUTE = `${APP_ROUTES.home}#${TECH_STACK_ANCHOR_ID}`

export function buildBlogArticleRoute(slug: string) {
  return `${APP_ROUTES.blog}/${slug.replace(/^\/+/, '')}`
}