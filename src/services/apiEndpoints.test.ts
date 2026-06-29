import { describe, expect, it } from 'vitest'
import { API_ENDPOINTS } from './apiEndpoints'

describe('API_ENDPOINTS', () => {
  it('keeps static endpoint paths stable', () => {
    expect(API_ENDPOINTS.projects).toBe('/projects')
    expect(API_ENDPOINTS.blogIndex).toBe('/blog')
  })

  it('encodes a nested Unicode article id as one path parameter', () => {
    expect(API_ENDPOINTS.blogArticle('java/集合')).toBe('/blog/java%2F%E9%9B%86%E5%90%88')
  })
})
