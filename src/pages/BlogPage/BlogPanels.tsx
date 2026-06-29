import { ChevronDown, ChevronRight, FileText, Folder, MessageCircle, Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MarkdownArticle } from '../../components/markdown/MarkdownArticle'
import { APP_ROUTES } from '../../config/routes'
import { textByLocale } from '../../services/i18n'
import type { BlogArticle, BlogSearchResult, BlogTreeNode } from '../../types/blog'
import type { AnnotationItem, AnnotationMap, Locale, UiCopy } from '../../types/content'

interface BlogSidebarProps {
  open: boolean
  ui: UiCopy
  locale: Locale
  query: string
  results: BlogSearchResult[]
  tree: BlogTreeNode[]
  openFolders: Set<string>
  articleId: string
  onQueryChange: (value: string) => void
  onOpenArticle: (slug: string) => void
  onToggleFolder: (name: string) => void
  onClose: () => void
}

export function BlogSidebar(props: BlogSidebarProps) {
  const { open, ui, locale, query, results, tree, openFolders, articleId, onQueryChange, onOpenArticle, onToggleFolder, onClose } = props
  return (
    <aside className={open ? 'blog-sidebar is-open' : 'blog-sidebar'}>
      <button className="blog-panel-close" type="button" onClick={onClose} aria-label="Close navigation"><X /></button>
      <Link className="blog-sidebar__title" to={APP_ROUTES.blog}><span>KNOWLEDGE / NOTES</span><strong>{textByLocale(ui['blog.title'], locale)}</strong></Link>
      <label className="blog-search"><Search /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={textByLocale(ui['blog.search'], locale)} /></label>
      {query.trim() ? <div className="blog-search-results">{results.map((result) => <button key={result.id} type="button" onClick={() => onOpenArticle(result.slug)}><strong>{result.title}</strong><span>{result.category}</span></button>)}</div> : (
        <nav className="blog-tree" aria-label="Article navigation">{tree.map((folder) => {
          const opened = openFolders.has(folder.name)
          return <div key={folder.id} className="blog-tree__folder">
            <button type="button" onClick={() => onToggleFolder(folder.name)}>
              {opened ? <ChevronDown /> : <ChevronRight />}<Folder /><span>{folder.name}</span>
            </button>
            {opened && <div>{folder.children?.map((article) => <button key={article.id} className={article.articleId === articleId ? 'is-active' : undefined} type="button" onClick={() => onOpenArticle(article.slug || '')}><FileText /><span>{article.name}</span></button>)}</div>}
          </div>
        })}</nav>
      )}
    </aside>
  )
}

interface BlogReaderProps {
  status: 'loading' | 'ready' | 'error'
  articleStatus: 'loading' | 'ready' | 'error'
  activeArticle: BlogArticle | null
  annotations: AnnotationMap
  tree: BlogTreeNode[]
  ui: UiCopy
  locale: Locale
  onRetry: () => void
  onSelectBlock: (blockId: string) => void
  onOpenFolder: (name: string) => void
}

export function BlogReader(props: BlogReaderProps) {
  const { status, articleStatus, activeArticle, annotations, tree, ui, locale, onRetry, onSelectBlock, onOpenFolder } = props
  if (status === 'loading' || articleStatus === 'loading') {
    return <main className="blog-reader"><div className="blog-landing"><p>{textByLocale(ui['common.loading'], locale)}</p></div></main>
  }
  if (status === 'error' || articleStatus === 'error') {
    return <main className="blog-reader"><div className="blog-landing"><p>{textByLocale(ui['error.body'], locale)}</p><button className="primary-link" type="button" onClick={onRetry}>{textByLocale(ui['common.retry'], locale)}</button></div></main>
  }
  if (activeArticle) {
    return <main className="blog-reader"><article className="markdown-article">
      <header><span>{activeArticle.category}</span><h1>{activeArticle.title}</h1></header>
      <MarkdownArticle content={activeArticle.content} sourcePath={activeArticle.sourcePath} annotations={annotations} onSelectBlock={onSelectBlock} />
    </article></main>
  }
  return <main className="blog-reader"><div className="blog-landing"><p>KNOWLEDGE / NOTES</p><h1 id="blog-title">{textByLocale(ui['blog.title'], locale)}</h1><span>{textByLocale(ui['blog.subtitle'], locale)}</span><div>{tree.map((folder) => <button key={folder.id} type="button" onClick={() => onOpenFolder(folder.name)}><Folder /><strong>{folder.name}</strong><span>{folder.children?.length || 0} notes</span></button>)}</div></div></main>
}

export function AnnotationPanel({ open, selectedBlock, notes, ui, locale, onClose }: {
  open: boolean
  selectedBlock: string
  notes: AnnotationItem[]
  ui: UiCopy
  locale: Locale
  onClose: () => void
}) {
  return <aside className={open ? 'annotation-panel is-open' : 'annotation-panel'}>
    <button className="blog-panel-close" type="button" onClick={onClose} aria-label="Close annotations"><X /></button>
    <div className="annotation-panel__heading"><MessageCircle /><span>{textByLocale(ui['blog.annotations'], locale)}</span></div>
    {selectedBlock && <code>{selectedBlock}</code>}
    {notes.length ? notes.map((note) => <article key={note.id}>{note.content}</article>) : <p>{textByLocale(ui['blog.noAnnotations'], locale)}</p>}
  </aside>
}
