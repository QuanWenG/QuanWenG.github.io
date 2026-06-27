import { ArrowLeft, Construction } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import { textByLocale } from '../../services/i18n'
import type { SiteConfig } from '../../types/content'

interface PlaceholderPageProps {
  pageId: 'blog' | 'projects' | 'music'
  site: SiteConfig
}

const pageTitle = {
  blog: { zh: '博客', en: 'Blog' },
  projects: { zh: '项目', en: 'Projects' },
  music: { zh: '音乐', en: 'Music' },
}

export function PlaceholderPage({ pageId, site }: PlaceholderPageProps) {
  const { locale } = usePreferences()
  const message = site.placeholders[pageId]

  return (
    <section className="placeholder-page" aria-labelledby="placeholder-title">
      <div className="placeholder-page__icon">
        <Construction size={28} aria-hidden="true" />
      </div>
      <p>{locale === 'zh' ? '第一轮地基已预留' : 'Reserved in the foundation pass'}</p>
      <h1 id="placeholder-title">{textByLocale(pageTitle[pageId], locale)}</h1>
      <span>{textByLocale(message, locale)}</span>
      <Link className="secondary-link" to="/">
        <ArrowLeft size={18} aria-hidden="true" />
        {locale === 'zh' ? '回到首页' : 'Back home'}
      </Link>
    </section>
  )
}

