import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { usePreferences } from '../../app/providers/usePreferences'
import { MEDIA_QUERIES } from '../../config/mediaQueries'
import { textByLocale } from '../../services/i18n'
import type { TechStackItem, UiCopy } from '../../types/content'
import type { ProjectItem } from '../../types/project'
import { useMediaQuery } from '../common/useMediaQuery'
import { GalaxyScene } from './TechGalaxyScene'
import { TECH_GALAXY_CANVAS_CONFIG } from './techGalaxyConfig'
import { TechDetailPanel, TechTierLegend } from './TechGalaxyUi'
import { resolveTechIcon } from './techIconAssets'

interface TechGalaxyProps {
  items: TechStackItem[]
  projects: ProjectItem[]
  ui: UiCopy
}

export function TechGalaxy({ items, projects, ui }: TechGalaxyProps) {
  const { locale } = usePreferences()
  const reduceMotion = useMediaQuery(MEDIA_QUERIES.reducedMotion)
  const compact = useMediaQuery(MEDIA_QUERIES.techGalaxyCompact)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedItem = items.find((item) => item.id === selectedId) || null

  useEffect(() => {
    if (!selectedItem) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedId(null) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selectedItem])

  if (compact || reduceMotion) {
    return <div className="tech-cosmos-fallback" aria-label="Tech stack list">
      <div className="tech-cosmos-fallback__stars" aria-hidden="true" />
      <TechTierLegend ui={ui} locale={locale} />
      {items.map((item) => <button key={item.id} type="button" className={`tech-cosmos-fallback__item is-${item.tier || 'supporting'}`} aria-label={item.name} onClick={() => setSelectedId(item.id)}>
        <span className="tech-cosmos-fallback__icon" style={{ boxShadow: `0 0 22px ${item.color}` }}><img src={resolveTechIcon(item)} alt="" aria-hidden="true" /></span>
        <span><strong>{item.name}</strong><small>{item.group}</small><p>{textByLocale(item.description, locale)}</p></span>
      </button>)}
      {selectedItem && <TechDetailPanel item={selectedItem} projects={projects} ui={ui} locale={locale} onClose={() => setSelectedId(null)} />}
    </div>
  }

  return <div className="tech-galaxy" aria-label="Interactive cosmic tech stack">
    <Canvas
      camera={TECH_GALAXY_CANVAS_CONFIG.camera}
      dpr={TECH_GALAXY_CANVAS_CONFIG.dpr}
      gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.setClearColor(TECH_GALAXY_CANVAS_CONFIG.background, 1) }}
    >
      <GalaxyScene items={items} reduceMotion={reduceMotion} onSelect={setSelectedId} />
    </Canvas>
    <TechTierLegend ui={ui} locale={locale} />
    {selectedItem && <TechDetailPanel item={selectedItem} projects={projects} ui={ui} locale={locale} onClose={() => setSelectedId(null)} />}
  </div>
}