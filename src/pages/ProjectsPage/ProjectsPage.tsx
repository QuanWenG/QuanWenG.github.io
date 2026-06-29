import { Archive, ArrowUpRight, Clock3, Code2, GitBranch, Sparkles, Star } from 'lucide-react'
import { useMemo, type CSSProperties } from 'react'
import { usePreferences } from '../../app/providers/usePreferences'
import { useMediaQuery } from '../../components/common/useMediaQuery'
import { textByLocale } from '../../services/i18n'
import { sortProjects } from '../../services/projects'
import type { UiCopy } from '../../types/content'
import type { ProjectItem } from '../../types/project'
import './ProjectsPage.css'

function stableHue(id: string) {
  return [...id].reduce((value, character) => (value * 31 + character.charCodeAt(0)) % 360, 137)
}

function coverHeight(id: string) {
  return 176 + (stableHue(id) % 4) * 28
}

function resolveCoverPath(cover: string) {
  if (!cover || /^(https?:|data:|blob:)/.test(cover)) return cover
  return `${import.meta.env.BASE_URL}${cover.replace(/^\/+/, '')}`
}

function formatUpdatedAt(value: string, locale: 'zh' | 'en') {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short' }).format(date)
}

function ProjectCard({ project, ui, locale }: { project: ProjectItem; ui: UiCopy; locale: 'zh' | 'en' }) {
  const categoryLabel = textByLocale(ui[`projects.category.${project.category}`], locale)
  const coverStyle = {
    '--project-hue': `${stableHue(project.id)}deg`,
    '--project-cover-height': `${coverHeight(project.id)}px`,
  } as CSSProperties

  return (
    <article className={`project-card${project.featured ? ' is-featured' : ''}${project.status === 'archived' ? ' is-archived' : ''}`}>
      <div className="project-card__cover" style={coverStyle}>
        {project.cover ? <img src={resolveCoverPath(project.cover)} alt="" loading="lazy" /> : <><Code2 aria-hidden="true" /><span>{project.techStack.slice(0, 3).join(' · ')}</span></>}
      </div>
      <div className="project-card__body">
        <div className="project-card__meta">
          <span className="project-card__category">{categoryLabel}</span>
          {project.featured && <span><Sparkles aria-hidden="true" /> Featured</span>}
          {project.status === 'archived' && <span><Archive aria-hidden="true" /> Archived</span>}
        </div>
        <h2>{project.name}</h2>
        <p>{project.description}</p>
        <dl className="project-card__facts">
          <div><dt><Star aria-hidden="true" /> Stars</dt><dd>{project.github.stars}</dd></div>
          <div><dt><Clock3 aria-hidden="true" /> {textByLocale(ui['projects.updated'], locale)}</dt><dd>{formatUpdatedAt(project.github.updatedAt, locale)}</dd></div>
          <div><dt><Code2 aria-hidden="true" /> Language</dt><dd>{project.github.primaryLanguage || '—'}</dd></div>
        </dl>
        <div className="project-card__tags">{project.techStack.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="project-card__links">
          {project.links.map((link) => <a key={link.repository} href={link.url} target="_blank" rel="noopener noreferrer"><GitBranch aria-hidden="true" />{link.label}<ArrowUpRight aria-hidden="true" /></a>)}
        </div>
      </div>
    </article>
  )
}

export function ProjectsPage({ ui, projects }: { ui: UiCopy; projects: ProjectItem[] }) {
  const { locale } = usePreferences()
  const compact = useMediaQuery('(max-width: 640px)')
  const tablet = useMediaQuery('(max-width: 980px)')
  const laneCount = compact ? 1 : tablet ? 2 : 3
  const sortedProjects = useMemo(() => sortProjects(projects), [projects])
  const lanes = useMemo(() => Array.from({ length: laneCount }, (_, laneIndex) => sortedProjects.filter((_, projectIndex) => projectIndex % laneCount === laneIndex)), [laneCount, sortedProjects])

  return (
    <section className="content-page projects-page" aria-labelledby="projects-title">
      <header className="content-page__header projects-hero">
        <p>GITHUB / BUILDS</p>
        <h1 id="projects-title">{textByLocale(ui['projects.title'], locale)}</h1>
        <span>{textByLocale(ui['projects.subtitle'], locale)}</span>
      </header>
      {sortedProjects.length ? <div className={`project-waterfall has-${laneCount}-lanes`}>{lanes.map((lane, laneIndex) => <div key={laneIndex} className="project-waterfall__lane">{lane.map((project) => <ProjectCard key={project.id} project={project} ui={ui} locale={locale} />)}</div>)}</div> : <p className="empty-state">{textByLocale(ui['projects.empty'], locale)}</p>}
    </section>
  )
}