import MiniSearch from 'minisearch'
import type { BlogArticle, BlogSearchResult } from '../types/blog'

export interface BlogSearch {
  search: (query: string) => BlogSearchResult[]
}

export function createBlogSearch(articles: BlogArticle[]): BlogSearch {
  const engine = new MiniSearch<BlogArticle>({
    fields: ['title', 'category', 'content'],
    storeFields: ['id', 'title', 'category', 'slug', 'sourcePath', 'order'],
  })
  engine.addAll(articles)

  return {
    search(query) {
      const normalizedQuery = query.trim().toLocaleLowerCase()
      if (!normalizedQuery) return []
      const indexed = engine.search(query, { prefix: true, fuzzy: 0.2 }).map((result) => ({
        id: String(result.id),
        title: String(result.title),
        category: String(result.category),
        slug: String(result.slug),
        sourcePath: String(result.sourcePath),
        order: Number(result.order),
        score: result.score,
      }))
      const indexedIds = new Set(indexed.map(({ id }) => id))
      const substringMatches = articles
        .filter((article) => !indexedIds.has(article.id) && `${article.title} ${article.category} ${article.content}`.toLocaleLowerCase().includes(normalizedQuery))
        .map(({ content: _content, ...article }) => ({ ...article, score: 1 }))
      return [...indexed, ...substringMatches].slice(0, 12)
    },
  }
}