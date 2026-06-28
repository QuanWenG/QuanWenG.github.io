import { Archive, ArrowUpRight, Code2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePreferences } from '../../app/providers/usePreferences'
import { dataSource } from '../../services'
import { textByLocale } from '../../services/i18n'
import { sortProjects } from '../../services/projects'
import type { UiCopy } from '../../types/content'
import type { ProjectItem } from '../../types/project'
import './ProjectsPage.css'

export function ProjectsPage({ ui }: { ui: UiCopy }) {
  const { locale } = usePreferences()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { void dataSource.getProjects().then((items) => { setProjects(sortProjects(items)); setLoading(false) }) }, [])
  return (
    <section className="content-page projects-page" aria-labelledby="projects-title">
      <header className="content-page__header">
        <p>GITHUB / BUILDS</p>
        <h1 id="projects-title">{textByLocale(ui['projects.title'], locale)}</h1>
        <span>{textByLocale(ui['projects.subtitle'], locale)}</span>
      </header>
      {loading ? <p className="empty-state">{textByLocale(ui['common.loading'], locale)}</p> : projects.length ? (
        <div className="project-waterfall">{projects.map((project, index) => (
          <article key={project.id} className={project.status === 'archived' ? 'project-card is-archived' : 'project-card'}>
            <a href={project.url} target="_blank" rel="noopener noreferrer" aria-label={`${project.name} on GitHub`}>
              <div className="project-card__cover" style={{ '--project-hue': `${(index * 71 + project.weight) % 360}deg` } as React.CSSProperties}>
                {project.cover ? <img src={project.cover} alt="" /> : <><Code2 /><span>{project.techStack.slice(0, 3).join(' · ')}</span></>}
              </div>
              <div className="project-card__body">
                <div className="project-card__meta">{project.featured && <span><Sparkles /> Featured</span>}{project.status === 'archived' && <span><Archive /> Archived</span>}<ArrowUpRight /></div>
                <h2>{project.name}</h2><p>{project.description}</p>
                <div className="project-card__tags">{project.techStack.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
            </a>
          </article>
        ))}</div>
      ) : <p className="empty-state">{textByLocale(ui['projects.empty'], locale)}</p>}
    </section>
  )
}
