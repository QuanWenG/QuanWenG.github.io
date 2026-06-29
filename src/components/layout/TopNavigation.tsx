import { Languages, Moon, Sun } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import { textByLocale } from '../../services/i18n'
import type { NavigationItem } from '../../types/content'

export function TopNavigation({ items }: { items: NavigationItem[] }) {
  const { locale, theme, toggleLocale, toggleTheme } = usePreferences()
  const [visible, setVisible] = useState(true)
  const [activeAnchor, setActiveAnchor] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const lastScroll = useRef(window.scrollY)
  const idleTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const scheduleHide = () => {
      window.clearTimeout(idleTimer.current)
      idleTimer.current = window.setTimeout(() => setVisible(false), 1800)
    }
    const onScroll = () => {
      const next = window.scrollY
      if (next < 24 || next < lastScroll.current - 8) setVisible(true)
      else if (next > lastScroll.current + 8) setVisible(false)
      lastScroll.current = next
      scheduleHide()
    }
    const onPointer = (event: PointerEvent) => { if (event.clientY < 28) setVisible(true) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    scheduleHide()
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('pointermove', onPointer); window.clearTimeout(idleTimer.current) }
  }, [])

  useEffect(() => {
    const target = document.getElementById('tech-stack')
    if (!target || location.pathname !== '/') { setActiveAnchor(''); return }
    const observer = new IntersectionObserver(([entry]) => setActiveAnchor(entry?.isIntersecting ? 'tech-stack' : ''), { threshold: 0.45 })
    observer.observe(target)
    return () => observer.disconnect()
  }, [location.pathname])

  useEffect(() => {
    if (!location.hash) return
    const timer = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 40)
    return () => window.clearTimeout(timer)
  }, [location.hash, location.pathname])

  const openItem = (item: NavigationItem) => {
    setVisible(false)
    if (!item.anchor) return
    if (location.pathname !== item.path) navigate(`${item.path}#${item.anchor}`)
    else document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return <header className={visible ? 'top-nav top-nav--visible' : 'top-nav'} onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)} onFocus={() => setVisible(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setVisible(false) }}>
    <Link className="top-nav__brand" to="/" aria-label="QuanWenG home" onClick={() => setVisible(false)}><span>Q</span><strong>QuanWenG</strong></Link>
    <nav className="top-nav__links" aria-label="Primary navigation">{items.filter((item) => item.showInNav).map((item) => {
      const active = item.anchor ? activeAnchor === item.anchor : item.path === location.pathname && !activeAnchor
      return item.anchor ? <button key={item.id} className={active ? 'is-active' : undefined} type="button" onClick={() => openItem(item)}>{textByLocale(item.label, locale)}</button> : <Link key={item.id} className={active ? 'is-active' : undefined} to={item.path} onClick={() => setVisible(false)}>{textByLocale(item.label, locale)}</Link>
    })}</nav>
    <div className="top-nav__actions"><button type="button" className="icon-button" onClick={toggleTheme} aria-label={locale === 'zh' ? '切换主题' : 'Toggle theme'}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button><button type="button" className="icon-button" onClick={toggleLocale} aria-label={locale === 'zh' ? '切换语言' : 'Toggle language'}><Languages size={16} /><span>{locale === 'zh' ? '中' : 'EN'}</span></button></div>
  </header>
}