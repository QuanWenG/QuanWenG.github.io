import { describe, expect, it } from 'vitest'
import { createBlogSearch } from './blogSearch'

describe('createBlogSearch', () => {
  it('searches title, category and article content', () => {
    const search = createBlogSearch([{
      id: 'java/list',
      title: 'Java 集合',
      category: 'Java',
      sourcePath: 'java/list.md',
      slug: 'java/list',
      order: 0,
      content: 'ArrayList 基于可扩容数组实现。',
    }])
    expect(search.search('扩容')[0]).toMatchObject({ id: 'java/list', slug: 'java/list' })
    expect(search.search('')).toEqual([])
  })
})
