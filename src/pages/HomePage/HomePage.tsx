import { ArrowRight, ExternalLink } from 'lucide-react'
import { Component, lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import { APP_ROUTES, TECH_STACK_ANCHOR_ID } from '../../config/routes'
import { ScrollCue } from '../../components/common/ScrollCue'
import { useScrollSnap } from '../../components/common/useScrollSnap'
import { GridWaveBackground } from '../../components/effects/GridWaveBackground'
import { HeroTerminal } from '../../components/effects/HeroTerminal'
import { textByLocale } from '../../services/i18n'
import type { SiteConfig, TechStackItem, UiCopy } from '../../types/content'
import type { ProjectItem } from '../../types/project'

const LazyTechGalaxy = lazy(() =>
  import('../../components/effects/TechGalaxy').then((module) => ({ default: module.TechGalaxy })),
)

interface HomePageProps {
  site: SiteConfig
  techStack: TechStackItem[]
  projects: ProjectItem[]
  ui: UiCopy
}

interface CosmicMapBoundaryProps {
  children: ReactNode
}

interface CosmicMapBoundaryState {
  hasError: boolean
}

class CosmicMapBoundary extends Component<CosmicMapBoundaryProps, CosmicMapBoundaryState> {
  state: CosmicMapBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div className="tech-loading">Cosmic map is recovering...</div>
    }

    return this.props.children
  }
}

export function HomePage({ site, techStack, projects, ui }: HomePageProps) {
  const { locale } = usePreferences()
  useScrollSnap()

  return (
    <>
      <section className="home-hero snap-panel" aria-labelledby="home-title">
        <GridWaveBackground />
        <div className="home-hero__content">
          <p className="home-hero__eyebrow">QuanWenG.github.io</p>
          <h1 id="home-title">{textByLocale(site.title, locale)}</h1>
          <p className="home-hero__subtitle">{textByLocale(site.subtitle, locale)}</p>
          <div className="home-hero__actions">
            <Link className="primary-link" to={APP_ROUTES.blog}>
              {textByLocale(ui['home.readBlog'], locale)}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a className="secondary-link" href={site.githubUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={18} aria-hidden="true" />
              GitHub
            </a>
          </div>
          <HeroTerminal site={site} />
        </div>
        <ScrollCue />
      </section>

      <section className="tech-section snap-panel" id={TECH_STACK_ANCHOR_ID} aria-labelledby="tech-title">
        <div className="tech-section__intro">
          <p>{textByLocale(ui['home.knowledgeMap'], locale)}</p>
          <h2 id="tech-title">{textByLocale(ui['home.techTitle'], locale)}</h2>
          <span>{textByLocale(ui['home.techDescription'], locale)}</span>
        </div>
        <CosmicMapBoundary>
          <Suspense fallback={<div className="tech-loading">Loading cosmic map...</div>}>
            <LazyTechGalaxy items={techStack} projects={projects} ui={ui} />
          </Suspense>
        </CosmicMapBoundary>
      </section>
    </>
  )
}