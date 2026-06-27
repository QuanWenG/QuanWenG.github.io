import { ArrowRight, ExternalLink } from 'lucide-react'
import { Component, lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import { ScrollCue } from '../../components/common/ScrollCue'
import { useScrollSnap } from '../../components/common/useScrollSnap'
import { GridWaveBackground } from '../../components/effects/GridWaveBackground'
import { HeroTerminal } from '../../components/effects/HeroTerminal'
import { textByLocale } from '../../services/i18n'
import type { SiteConfig, TechStackItem } from '../../types/content'

const LazyTechGalaxy = lazy(() =>
  import('../../components/effects/TechGalaxy').then((module) => ({ default: module.TechGalaxy })),
)

interface HomePageProps {
  site: SiteConfig
  techStack: TechStackItem[]
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

export function HomePage({ site, techStack }: HomePageProps) {
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
            <Link className="primary-link" to="/blog">
              {locale === 'zh' ? '进入博客' : 'Read Blog'}
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

      <section className="tech-section snap-panel" id="tech-stack" aria-labelledby="tech-title">
        <div className="tech-section__intro">
          <p>{locale === 'zh' ? '知识星图' : 'Knowledge Map'}</p>
          <h2 id="tech-title">{locale === 'zh' ? '技术栈在这里形成轨道' : 'A living orbit of the stack'}</h2>
          <span>
            {locale === 'zh'
              ? '把技术栈放进一片会呼吸的宇宙，后续会连接博客、项目和搜索。'
              : 'A breathing cosmos for the stack; later it will connect notes, projects, and search.'}
          </span>
        </div>
        <CosmicMapBoundary>
          <Suspense fallback={<div className="tech-loading">Loading cosmic map...</div>}>
            <LazyTechGalaxy items={techStack} />
          </Suspense>
        </CosmicMapBoundary>
      </section>
    </>
  )
}
