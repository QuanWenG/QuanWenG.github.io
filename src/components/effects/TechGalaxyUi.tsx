import { ArrowRight, BookOpen, FolderGit2, Search, X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import { APP_ROUTES, buildBlogArticleRoute } from '../../config/routes'
import { textByLocale } from '../../services/i18n'
import type { TechGalaxySearchResult } from '../../services/techGalaxySearch'
import type { Locale, TechStackItem, TechTier, UiCopy } from '../../types/content'
import type { ProjectItem } from '../../types/project'
import { resolveTechIcon } from './techIconAssets'

export function TechDetailPanel({ item, projects, ui, locale, onClose }: {
  item: TechStackItem
  projects: ProjectItem[]
  ui: UiCopy
  locale: Locale
  onClose: () => void
}) {
  const panelRef = useRef<HTMLElement>(null)
  const relatedProjects = projects.filter((project) => (item.projectIds || []).includes(project.id))
  const tier = item.tier ?? 'supporting'
  useEffect(() => { panelRef.current?.focus() }, [item.id])

  return <aside ref={panelRef} className="tech-detail-panel" tabIndex={-1} aria-labelledby="tech-detail-title">
    <button className="tech-detail-panel__close" type="button" onClick={onClose} aria-label={textByLocale(ui['tech.closeDetails'], locale)}><X aria-hidden="true" /></button>
    <span className={`tech-detail-panel__tier is-${tier}`}>{textByLocale(ui[`tech.tier.${tier}`], locale)}</span>
    <div className="tech-detail-panel__title"><img src={resolveTechIcon(item)} alt="" aria-hidden="true" /><div><h3 id="tech-detail-title">{item.name}</h3><small>{item.group}</small></div></div>
    <p>{textByLocale(item.description, locale)}</p>
    {relatedProjects.length > 0 && <section><h4><FolderGit2 aria-hidden="true" />{textByLocale(ui['tech.relatedProjects'], locale)}</h4><div className="tech-detail-panel__links">{relatedProjects.map((project) => <a key={project.id} href={project.url} target="_blank" rel="noopener noreferrer">{project.name}</a>)}</div></section>}
    {(item.articles || []).length > 0 && <section><h4><BookOpen aria-hidden="true" />{textByLocale(ui['tech.relatedArticles'], locale)}</h4><div className="tech-detail-panel__links">{item.articles?.map((article) => <Link key={article.slug} to={buildBlogArticleRoute(article.slug)}>{textByLocale(article.title, locale)}</Link>)}</div></section>}
    {relatedProjects.length > 0 && <Link className="tech-detail-panel__cta" to={APP_ROUTES.projects}>{textByLocale(ui['tech.viewProjects'], locale)}<ArrowRight aria-hidden="true" /></Link>}
  </aside>
}

export function TechTierLegend({ ui, locale }: { ui: UiCopy; locale: Locale }) {
  return <div className="tech-tier-legend" aria-label="Technology orbit legend">{(['primary', 'supporting', 'learning'] as TechTier[]).map((tier) => <span key={tier} className={`is-${tier}`}>{textByLocale(ui[`tech.tier.${tier}`], locale)}</span>)}</div>
}

export function TechGalaxySearchBox({
  hint,
  locale,
  onClear,
  onQueryChange,
  onSearch,
  onSelectResult,
  placeholder,
  query,
  results,
  resultsOpen,
  ui,
}: {
  hint: string
  locale: Locale
  onClear: () => void
  onQueryChange: (value: string) => void
  onSearch: () => void
  onSelectResult: (itemId: string) => void
  placeholder: string
  query: string
  results: TechGalaxySearchResult[]
  resultsOpen: boolean
  ui: UiCopy
}) {
  const resultListId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const trimmedQuery = query.trim()
  const hasResults = results.length > 0
  const label = textByLocale(ui['tech.search.label'], locale)
  const focusInputFromField = (target: EventTarget | null) => {
    const targetElement = target instanceof Element ? target : null
    if (targetElement?.closest('button')) return
    inputRef.current?.focus()
  }

  return (
    <form
      className="tech-search"
      role="search"
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault()
        onSearch()
      }}
    >
      <label
        className="tech-search__field"
        onClick={(event) => focusInputFromField(event.target)}
        onMouseDown={(event) => focusInputFromField(event.target)}
        onPointerDown={(event) => focusInputFromField(event.target)}
      >
        <Search aria-hidden="true" />
        <span className="sr-only">{label}</span>
        {trimmedQuery && hint && (
          <span className="tech-search__ghost" aria-hidden="true">
            <strong>{query}</strong>
            <span>{hint}</span>
          </span>
        )}
        <input
          ref={inputRef}
          aria-controls={resultListId}
          aria-label={label}
          autoComplete="off"
          inputMode="search"
          placeholder={placeholder}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onSearch()
            }
          }}
        />
        {trimmedQuery && (
          <button
            className="tech-search__clear"
            type="button"
            onClick={onClear}
            aria-label={textByLocale(ui['tech.search.clear'], locale)}
          >
            <X aria-hidden="true" />
          </button>
        )}
      </label>

      {resultsOpen && trimmedQuery && (
        <div className="tech-search__results" id={resultListId} aria-live="polite">
          {hasResults ? results.map((result) => (
            <button key={result.itemId} type="button" onClick={() => onSelectResult(result.itemId)}>
              <strong>{result.title}</strong>
              <span>{result.group}</span>
              <small>{result.matchedText}</small>
            </button>
          )) : <p>{textByLocale(ui['tech.search.noMatches'], locale)}</p>}
        </div>
      )}
    </form>
  )
}
