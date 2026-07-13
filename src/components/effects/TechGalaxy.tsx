import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePreferences } from '../../app/providers/usePreferences'
import { MEDIA_QUERIES } from '../../config/mediaQueries'
import { textByLocale } from '../../services/i18n'
import { createTechGalaxySearch } from '../../services/techGalaxySearch'
import type { TechStackItem, UiCopy } from '../../types/content'
import type { ProjectItem } from '../../types/project'
import { useMediaQuery } from '../common/useMediaQuery'
import { GalaxyScene } from './TechGalaxySceneV2'
import { TECH_GALAXY_CANVAS_CONFIG } from './techGalaxyConfig'
import { TechDetailPanel, TechGalaxySearchBox, TechTierLegend } from './TechGalaxyUi'
import { resolveTechIcon } from './techIconAssets'

interface TechGalaxyProps {
  items: TechStackItem[]
  projects: ProjectItem[]
  ui: UiCopy
}

export function TechGalaxy({ items, projects, ui }: TechGalaxyProps) {
  const { locale, uiVisibility } = usePreferences()
  const reduceMotion = useMediaQuery(MEDIA_QUERIES.reducedMotion)
  const compact = useMediaQuery(MEDIA_QUERIES.techGalaxyCompact)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResultsOpen, setSearchResultsOpen] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(() => Math.floor(Math.random() * Math.max(items.length, 1)))
  const [focusRequest, setFocusRequest] = useState<{ id: string; nonce: number } | null>(null)
  const [warping, setWarping] = useState(false)
  const fallbackItemRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const warpTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const selectedItem = items.find((item) => item.id === selectedId) || null
  const search = useMemo(() => createTechGalaxySearch(items, projects), [items, projects])
  const searchResults = useMemo(() => search.search(searchQuery), [search, searchQuery])
  const searchHint = useMemo(() => search.getHint(searchQuery), [search, searchQuery])
  const searchPlaceholder = useMemo(() => {
    const fallback = textByLocale(ui['tech.search.placeholder'], locale)
    if (!items.length) return fallback
    const item = items[placeholderIndex % items.length]
    return `${textByLocale(ui['tech.search.hint'], locale)} ${item.name}`
  }, [items, locale, placeholderIndex, ui])

  const focusTechItem = useCallback((id: string) => {
    if (!items.some((item) => item.id === id)) return
    setSelectedId(id)
    setFocusRequest((current) => ({ id, nonce: (current?.nonce ?? 0) + 1 }))
    setWarping(true)
    if (warpTimerRef.current) window.clearTimeout(warpTimerRef.current)
    warpTimerRef.current = window.setTimeout(() => setWarping(false), 900)
  }, [items])

  const handleQueryChange = useCallback((value: string) => {
    setSearchQuery(value)
    setSearchResultsOpen(Boolean(value.trim()))
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResultsOpen(false)
  }, [])

  const handleSearch = useCallback(() => {
    setSearchResultsOpen(false)
    if (!searchQuery.trim()) return
    const firstResult = searchResults[0]
    if (firstResult) focusTechItem(firstResult.itemId)
  }, [focusTechItem, searchQuery, searchResults])

  const handleSelectSearchResult = useCallback((itemId: string) => {
    focusTechItem(itemId)
    setSearchResultsOpen(false)
  }, [focusTechItem])

  const searchBox = <TechGalaxySearchBox
    hint={searchHint}
    locale={locale}
    onClear={handleClearSearch}
    onQueryChange={handleQueryChange}
    onSearch={handleSearch}
    onSelectResult={handleSelectSearchResult}
    placeholder={searchPlaceholder}
    query={searchQuery}
    results={searchResults}
    resultsOpen={searchResultsOpen}
    ui={ui}
  />

  useEffect(() => {
    if (!items.length) return
    setPlaceholderIndex(Math.floor(Math.random() * items.length))
  }, [items.length, locale])

  useEffect(() => {
    if (!selectedItem) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedId(null) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selectedItem])

  useEffect(() => () => {
    if (warpTimerRef.current) window.clearTimeout(warpTimerRef.current)
  }, [])

  useEffect(() => {
    if (!focusRequest || !(compact || reduceMotion)) return
    const target = fallbackItemRefs.current[focusRequest.id]
    if (typeof target?.scrollIntoView !== 'function') return
    target.scrollIntoView({
      block: 'center',
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [compact, focusRequest, reduceMotion])

  if (compact || reduceMotion) {
    return <div className={warping ? 'tech-cosmos-fallback is-search-warping' : 'tech-cosmos-fallback'} aria-label="Tech stack list">
      <div className="tech-cosmos-fallback__stars" aria-hidden="true" />
      {uiVisibility.techGalaxySearch && searchBox}
      {uiVisibility.techGalaxyLegend && <TechTierLegend ui={ui} locale={locale} />}
      {items.map((item) => <button
        key={item.id}
        ref={(node) => { fallbackItemRefs.current[item.id] = node }}
        type="button"
        className={`tech-cosmos-fallback__item is-${item.tier || 'supporting'}${selectedId === item.id ? ' is-selected' : ''}`}
        aria-label={item.name}
        aria-pressed={selectedId === item.id}
        onClick={() => focusTechItem(item.id)}
      >
        <span className="tech-cosmos-fallback__icon" style={{ boxShadow: `0 0 22px ${item.color}` }}><img src={resolveTechIcon(item)} alt="" aria-hidden="true" /></span>
        <span><strong>{item.name}</strong><small>{item.group}</small><p>{textByLocale(item.description, locale)}</p></span>
      </button>)}
      {selectedItem && <TechDetailPanel item={selectedItem} projects={projects} ui={ui} locale={locale} onClose={() => setSelectedId(null)} />}
    </div>
  }

  return <>
    <div className={warping ? 'tech-galaxy is-search-warping' : 'tech-galaxy'} aria-label="Interactive cosmic tech stack">
      <Canvas
        camera={TECH_GALAXY_CANVAS_CONFIG.camera}
        dpr={TECH_GALAXY_CANVAS_CONFIG.dpr}
        gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => { gl.setClearColor(TECH_GALAXY_CANVAS_CONFIG.background, 1) }}
      >
        <GalaxyScene items={items} reduceMotion={reduceMotion} selectedId={selectedId} focusRequest={focusRequest} onSelect={focusTechItem} />
      </Canvas>
    </div>
    {uiVisibility.techGalaxySearch && searchBox}
    {uiVisibility.techGalaxyLegend && <TechTierLegend ui={ui} locale={locale} />}
    {selectedItem && <TechDetailPanel item={selectedItem} projects={projects} ui={ui} locale={locale} onClose={() => setSelectedId(null)} />}
  </>
}



