import type { BlogArticle, BlogArticleMeta, BlogTreeNode } from '../types/blog'

const markdownModules = import.meta.glob('../assets/markdown/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function toMeta(modulePath: string, order: number): BlogArticleMeta {
  const relative = modulePath.replace('../assets/markdown/', '')
  const id = relative.replace(/\.md$/i, '')
  const parts = id.split('/')
  const title = parts.at(-1) || id
  const category = parts.length > 1 ? parts[0] : '未分类'
  return {
    id,
    title,
    category,
    sourcePath: `src/assets/markdown/${relative}`,
    slug: parts.map(encodeURIComponent).join('/'),
    order,
  }
}

const articles = Object.entries(markdownModules)
  .map(([modulePath, content], index) => ({ ...toMeta(modulePath, index), content }))
  .sort((a, b) => a.category.localeCompare(b.category, 'zh-CN') || a.title.localeCompare(b.title, 'zh-CN'))

export function getLocalBlogIndex(): BlogArticleMeta[] {
  return articles.map(({ content: _content, ...meta }) => meta)
}

export function getLocalBlogArticle(id: string): BlogArticle | null {
  return articles.find((article) => article.id === id) || null
}

export function buildBlogTree(index: BlogArticleMeta[]): BlogTreeNode[] {
  const folders = new Map<string, BlogTreeNode>()
  for (const article of index) {
    let folder = folders.get(article.category)
    if (!folder) {
      folder = { id: `folder-${article.category}`, name: article.category, type: 'folder', children: [] }
      folders.set(article.category, folder)
    }
    folder.children?.push({
      id: `article-${article.id}`,
      name: article.title,
      type: 'article',
      articleId: article.id,
      slug: article.slug,
    })
  }
  return [...folders.values()]
}