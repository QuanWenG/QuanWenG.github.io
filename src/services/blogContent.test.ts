import { describe, expect, it } from 'vitest'
import { buildBlogTree, getLocalBlogArticle, getLocalBlogIndex } from './blogContent'

describe('local blog content', () => {
  it('builds metadata from every markdown file', () => {
    const index = getLocalBlogIndex()
    expect(index.length).toBeGreaterThanOrEqual(6)
    expect(index.every((article) => article.sourcePath.startsWith('src/assets/markdown/'))).toBe(true)
  })
  it('builds collapsed folder-ready trees and resolves articles by stable id', () => {
    const index = getLocalBlogIndex()
    const tree = buildBlogTree(index)
    expect(tree.every((node) => node.type === 'folder' && node.children?.length)).toBe(true)
    expect(getLocalBlogArticle(index[0].id)?.id).toBe(index[0].id)
  })
})