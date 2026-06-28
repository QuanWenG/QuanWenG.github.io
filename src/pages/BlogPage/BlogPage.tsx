import { ChevronDown, ChevronRight, FileText, Folder, Menu, MessageCircle, Search, X } from 'lucide-react'
import MiniSearch from 'minisearch'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import { MarkdownArticle } from '../../components/markdown/MarkdownArticle'
import { dataSource } from '../../services'
import { buildBlogTree } from '../../services/blogContent'
import { textByLocale } from '../../services/i18n'
import type { BlogArticle, BlogArticleMeta } from '../../types/blog'
import type { AnnotationMap, UiCopy } from '../../types/content'
import './BlogPage.css'

function safeArticleId(value?: string) {
  if (!value) return ''
  try { return value.split('/').map(decodeURIComponent).join('/') } catch { return value }
}

export function BlogPage({ ui }: { ui: UiCopy }) {
  const { locale } = usePreferences()
  const params = useParams()
  const navigate = useNavigate()
  const articleId = safeArticleId(params['*'])
  const [index, setIndex] = useState<BlogArticleMeta[]>([])
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [annotations, setAnnotations] = useState<AnnotationMap>({})
  const [activeArticle, setActiveArticle] = useState<BlogArticle | null>(null)
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())
  const [selectedBlock, setSelectedBlock] = useState('')
  const [query, setQuery] = useState('')
  const [navOpen, setNavOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([dataSource.getBlogIndex(), dataSource.getAnnotations()]).then(async ([nextIndex, nextAnnotations]) => {
      const loaded = (await Promise.all(nextIndex.map((meta) => dataSource.getBlogArticle(meta.id)))).filter((article): article is BlogArticle => Boolean(article))
      if (mounted) {
        setIndex(nextIndex)
        setArticles(loaded)
        setAnnotations(nextAnnotations)
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!articleId) { setActiveArticle(null); return }
    const local = articles.find((article) => article.id === articleId)
    if (local) {
      setActiveArticle(local)
      setOpenFolders((current) => new Set(current).add(local.category))
      setSelectedBlock('')
      return
    }
    void dataSource.getBlogArticle(articleId).then(setActiveArticle)
  }, [articleId, articles])

  const tree = useMemo(() => buildBlogTree(index), [index])
  const search = useMemo(() => {
    const engine = new MiniSearch<BlogArticle>({ fields: ['title', 'category', 'content'], storeFields: ['id', 'title', 'category', 'slug', 'sourcePath', 'order'] })
    engine.addAll(articles)
    return engine
  }, [articles])
  const results = query.trim() ? search.search(query, { prefix: true, fuzzy: 0.2 }).slice(0, 12) : []
  const activeNotes = activeArticle && selectedBlock ? annotations[activeArticle.sourcePath]?.[selectedBlock] || [] : []

  const openArticle = (slug: string) => {
    navigate(`/blog/${slug}`)
    setNavOpen(false)
  }

  return (
    <section className="blog-page" aria-labelledby="blog-title">
      <header className="blog-page__mobile-bar">
        <button type="button" onClick={() => setNavOpen(true)} aria-label="Open article navigation"><Menu /></button>
        <strong>{activeArticle?.title || textByLocale(ui['blog.title'], locale)}</strong>
        <button type="button" onClick={() => setNotesOpen(true)} aria-label="Open annotations"><MessageCircle /></button>
      </header>
      <aside className={navOpen ? 'blog-sidebar is-open' : 'blog-sidebar'}>
        <button className="blog-panel-close" type="button" onClick={() => setNavOpen(false)} aria-label="Close navigation"><X /></button>
        <Link className="blog-sidebar__title" to="/blog"><span>KNOWLEDGE / NOTES</span><strong>{textByLocale(ui['blog.title'], locale)}</strong></Link>
        <label className="blog-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={textByLocale(ui['blog.search'], locale)} /></label>
        {query.trim() ? <div className="blog-search-results">{results.map((result) => <button key={String(result.id)} type="button" onClick={() => openArticle(String(result.slug))}><strong>{String(result.title)}</strong><span>{String(result.category)}</span></button>)}</div> : (
          <nav className="blog-tree" aria-label="Article navigation">{tree.map((folder) => {
            const opened = openFolders.has(folder.name)
            return <div key={folder.id} className="blog-tree__folder">
              <button type="button" onClick={() => setOpenFolders((current) => { const next = new Set(current); if (opened) next.delete(folder.name); else next.add(folder.name); return next })}>
                {opened ? <ChevronDown /> : <ChevronRight />}<Folder /><span>{folder.name}</span>
              </button>
              {opened && <div>{folder.children?.map((article) => <button key={article.id} className={article.articleId === articleId ? 'is-active' : undefined} type="button" onClick={() => openArticle(article.slug || '')}><FileText /><span>{article.name}</span></button>)}</div>}
            </div>
          })}</nav>
        )}
      </aside>
      <main className="blog-reader">
        {loading ? <div className="blog-landing"><p>{textByLocale(ui['common.loading'], locale)}</p></div> : activeArticle ? (
          <article className="markdown-article">
            <header><span>{activeArticle.category}</span><h1>{activeArticle.title}</h1></header>
            <MarkdownArticle content={activeArticle.content} sourcePath={activeArticle.sourcePath} annotations={annotations} onSelectBlock={(blockId) => { setSelectedBlock(blockId); setNotesOpen(true) }} />
          </article>
        ) : (
          <div className="blog-landing"><p>KNOWLEDGE / NOTES</p><h1 id="blog-title">{textByLocale(ui['blog.title'], locale)}</h1><span>{textByLocale(ui['blog.subtitle'], locale)}</span><div>{tree.map((folder) => <button key={folder.id} type="button" onClick={() => { setOpenFolders(new Set([folder.name])); setNavOpen(true) }}><Folder /><strong>{folder.name}</strong><span>{folder.children?.length || 0} notes</span></button>)}</div></div>
        )}
      </main>
      <aside className={notesOpen ? 'annotation-panel is-open' : 'annotation-panel'}>
        <button className="blog-panel-close" type="button" onClick={() => setNotesOpen(false)} aria-label="Close annotations"><X /></button>
        <div className="annotation-panel__heading"><MessageCircle /><span>{textByLocale(ui['blog.annotations'], locale)}</span></div>
        {selectedBlock && <code>{selectedBlock}</code>}
        {activeNotes.length ? activeNotes.map((note) => <article key={note.id}>{note.content}</article>) : <p>{textByLocale(ui['blog.noAnnotations'], locale)}</p>}
      </aside>
    </section>
  )
}