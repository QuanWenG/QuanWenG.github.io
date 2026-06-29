import { Menu, MessageCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import { buildBlogArticleRoute } from '../../config/routes'
import type { ContentService } from '../../services'
import { buildBlogTree } from '../../services/blogContent'
import { createBlogSearch } from '../../services/blogSearch'
import { textByLocale } from '../../services/i18n'
import type { UiCopy } from '../../types/content'
import { AnnotationPanel, BlogReader, BlogSidebar } from './BlogPanels'
import { useBlogLibrary } from './useBlogLibrary'
import './BlogPage.css'

function safeArticleId(value?: string) {
  if (!value) return ''
  try { return value.split('/').map(decodeURIComponent).join('/') } catch { return value }
}

export function BlogPage({ ui, contentService }: { ui: UiCopy; contentService: ContentService }) {
  const { locale } = usePreferences()
  const params = useParams()
  const navigate = useNavigate()
  const articleId = safeArticleId(params['*'])
  const library = useBlogLibrary(contentService, articleId)
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())
  const [selectedBlock, setSelectedBlock] = useState('')
  const [query, setQuery] = useState('')
  const [navOpen, setNavOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)

  useEffect(() => {
    if (!library.activeArticle) return
    setOpenFolders((current) => new Set(current).add(library.activeArticle?.category || ''))
    setSelectedBlock('')
  }, [library.activeArticle])

  const tree = useMemo(() => buildBlogTree(library.index), [library.index])
  const search = useMemo(() => createBlogSearch(library.articles), [library.articles])
  const results = useMemo(() => search.search(query), [query, search])
  const activeNotes = library.activeArticle && selectedBlock
    ? library.annotations[library.activeArticle.sourcePath]?.[selectedBlock] || []
    : []

  const openArticle = (slug: string) => {
    navigate(buildBlogArticleRoute(slug))
    setNavOpen(false)
  }

  const openFolder = (name: string) => {
    setOpenFolders(new Set([name]))
    setNavOpen(true)
  }

  return (
    <section className="blog-page" aria-labelledby="blog-title">
      <header className="blog-page__mobile-bar">
        <button type="button" onClick={() => setNavOpen(true)} aria-label="Open article navigation"><Menu /></button>
        <strong>{library.activeArticle?.title || textByLocale(ui['blog.title'], locale)}</strong>
        <button type="button" onClick={() => setNotesOpen(true)} aria-label="Open annotations"><MessageCircle /></button>
      </header>
      <BlogSidebar
        open={navOpen}
        ui={ui}
        locale={locale}
        query={query}
        results={results}
        tree={tree}
        openFolders={openFolders}
        articleId={articleId}
        onQueryChange={setQuery}
        onOpenArticle={openArticle}
        onToggleFolder={(name) => setOpenFolders((current) => {
          const next = new Set(current)
          if (next.has(name)) next.delete(name)
          else next.add(name)
          return next
        })}
        onClose={() => setNavOpen(false)}
      />
      <BlogReader
        status={library.status}
        articleStatus={library.articleStatus}
        activeArticle={library.activeArticle}
        annotations={library.annotations}
        tree={tree}
        ui={ui}
        locale={locale}
        onRetry={library.retry}
        onSelectBlock={(blockId) => {
          setSelectedBlock(blockId)
          setNotesOpen(true)
        }}
        onOpenFolder={openFolder}
      />
      <AnnotationPanel
        open={notesOpen}
        selectedBlock={selectedBlock}
        notes={activeNotes}
        ui={ui}
        locale={locale}
        onClose={() => setNotesOpen(false)}
      />
    </section>
  )
}