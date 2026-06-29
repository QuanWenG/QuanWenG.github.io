import { ArrowLeft, Orbit } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_ROUTES } from '../../config/routes'
import { usePreferences } from '../../app/providers/usePreferences'
import { textByLocale } from '../../services/i18n'
import type { UiCopy } from '../../types/content'
import './NotFoundPage.css'

export function NotFoundPage({ ui }: { ui: UiCopy }) {
  const { locale } = usePreferences()
  return <section className="not-found"><Orbit /><p>404 / LOST IN ORBIT</p><h1>{textByLocale(ui['notFound.title'], locale)}</h1><span>{textByLocale(ui['notFound.body'], locale)}</span><Link className="primary-link" to={APP_ROUTES.home}><ArrowLeft />{textByLocale(ui['common.backHome'], locale)}</Link></section>
}