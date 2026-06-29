import { describe, expect, it } from 'vitest'
import navigation from '../data/navigation.json'
import { APP_ROUTES, buildBlogArticleRoute, TECH_STACK_ANCHOR_ID, TECH_STACK_ROUTE } from './routes'

describe('application routes', () => {
  it('builds Unicode and nested blog routes without changing the slug', () => {
    expect(buildBlogArticleRoute('java/集合/映射')).toBe('/blog/java/集合/映射')
    expect(buildBlogArticleRoute('/数据库/mysql')).toBe('/blog/数据库/mysql')
  })

  it('keeps navigation data aligned with route constants', () => {
    const paths = Object.fromEntries(navigation.map(({ id, path }) => [id, path]))
    expect(paths).toMatchObject({
      home: APP_ROUTES.home,
      tech: APP_ROUTES.home,
      blog: APP_ROUTES.blog,
      projects: APP_ROUTES.projects,
      music: APP_ROUTES.music,
    })
    expect(navigation.find(({ id }) => id === 'tech')?.anchor).toBe(TECH_STACK_ANCHOR_ID)
    expect(TECH_STACK_ROUTE).toBe('/#tech-stack')
  })
})
