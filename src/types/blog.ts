export interface BlogArticleMeta {
  id: string
  title: string
  category: string
  sourcePath: string
  slug: string
  order: number
}

export interface BlogArticle extends BlogArticleMeta {
  content: string
}

export interface BlogTreeNode {
  id: string
  name: string
  type: 'folder' | 'article'
  articleId?: string
  slug?: string
  children?: BlogTreeNode[]
}

export interface CommentableBlock {
  blockId: string
  type: 'heading' | 'paragraph' | 'listItem' | 'code'
  path: number[]
}

export interface BlogSearchResult extends BlogArticleMeta {
  score: number
}