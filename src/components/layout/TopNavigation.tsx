import { Languages, Moon, Settings, Sun } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import type { UiVisibilityKey } from '../../app/providers/preferencesContext'
import { APP_ROUTES, TECH_STACK_ANCHOR_ID } from '../../config/routes'
import { textByLocale } from '../../services/i18n'
import type { NavigationItem, UiCopy } from '../../types/content'

const NAV_IDLE_HIDE_DELAY_MS = 1800
const NAV_SCROLL_TOP_VISIBILITY_PX = 24
const NAV_SCROLL_DIRECTION_THRESHOLD_PX = 8
const NAV_POINTER_REVEAL_ZONE_PX = 28
const NAV_ANCHOR_OBSERVER_THRESHOLD = 0.45
const NAV_HASH_SCROLL_DELAY_MS = 40

const SETTINGS_ITEMS: Array<{ key: UiVisibilityKey; labelKey: string; descriptionKey: string }> = [
  { key: 'musicDock', labelKey: 'settings.musicDock', descriptionKey: 'settings.musicDockDescription' },
  { key: 'homeTerminal', labelKey: 'settings.homeTerminal', descriptionKey: 'settings.homeTerminalDescription' },
  { key: 'scrollCue', labelKey: 'settings.scrollCue', descriptionKey: 'settings.scrollCueDescription' },
  { key: 'techGalaxySearch', labelKey: 'settings.techGalaxySearch', descriptionKey: 'settings.techGalaxySearchDescription' },
  { key: 'techGalaxyLegend', labelKey: 'settings.techGalaxyLegend', descriptionKey: 'settings.techGalaxyLegendDescription' },
]

export function TopNavigation({ items, ui }: { items: NavigationItem[]; ui: UiCopy }) {
  const { locale, theme, toggleLocale, toggleTheme, uiVisibility, toggleUiVisibility } = usePreferences()
  const [visible, setVisible] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeAnchor, setActiveAnchor] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const lastScroll = useRef(window.scrollY)
  const idleTimer = useRef<number | undefined>(undefined)
  const navRef = useRef<HTMLElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const settingsPanelId = useId()

  useEffect(() => {
    const scheduleHide = () => {
      window.clearTimeout(idleTimer.current)
      if (settingsOpen) {
        setVisible(true)
        return
      }
      idleTimer.current = window.setTimeout(() => setVisible(false), NAV_IDLE_HIDE_DELAY_MS)
    }
    const onScroll = () => {
      const next = window.scrollY
      if (settingsOpen || next < NAV_SCROLL_TOP_VISIBILITY_PX || next < lastScroll.current - NAV_SCROLL_DIRECTION_THRESHOLD_PX) setVisible(true)
      else if (next > lastScroll.current + NAV_SCROLL_DIRECTION_THRESHOLD_PX) setVisible(false)
      lastScroll.current = next
      scheduleHide()
    }
    const onPointer = (event: PointerEvent) => { if (event.clientY < NAV_POINTER_REVEAL_ZONE_PX) setVisible(true) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    scheduleHide()
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('pointermove', onPointer); window.clearTimeout(idleTimer.current) }
  }, [settingsOpen])

  useEffect(() => {
    if (!settingsOpen) return
    setVisible(true)
    const closeFromOutside = (event: PointerEvent) => {
      if (navRef.current?.contains(event.target as Node)) return
      setSettingsOpen(false)
    }
    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setSettingsOpen(false)
      settingsButtonRef.current?.focus()
    }
    document.addEventListener('pointerdown', closeFromOutside)
    window.addEventListener('keydown', closeFromEscape)
    return () => {
      document.removeEventListener('pointerdown', closeFromOutside)
      window.removeEventListener('keydown', closeFromEscape)
    }
  }, [settingsOpen])

  useEffect(() => {
    const target = document.getElementById(TECH_STACK_ANCHOR_ID)
    if (!target || location.pathname !== APP_ROUTES.home) { setActiveAnchor(''); return }
    const observer = new IntersectionObserver(([entry]) => setActiveAnchor(entry?.isIntersecting ? TECH_STACK_ANCHOR_ID : ''), { threshold: NAV_ANCHOR_OBSERVER_THRESHOLD })
    observer.observe(target)
    return () => observer.disconnect()
  }, [location.pathname])

  useEffect(() => {
    if (!location.hash) return
    const timer = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), NAV_HASH_SCROLL_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [location.hash, location.pathname])

  const openItem = (item: NavigationItem) => {
    setVisible(false)
    setSettingsOpen(false)
    if (!item.anchor) return
    if (location.pathname !== item.path) navigate(`${item.path}#${item.anchor}`)
    else document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return <header ref={navRef} className={visible ? 'top-nav top-nav--visible' : 'top-nav'} onMouseEnter={() => setVisible(true)} onMouseLeave={() => { if (!settingsOpen) setVisible(false) }} onFocus={() => setVisible(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setVisible(false); setSettingsOpen(false) } }}>
    <Link className="top-nav__brand" to={APP_ROUTES.home} aria-label="QuanWenG home" onClick={() => { setVisible(false); setSettingsOpen(false) }}><span>Q</span><strong>QuanWenG</strong></Link>
    <nav className="top-nav__links" aria-label="Primary navigation">{items.filter((item) => item.showInNav).map((item) => {
      const active = item.anchor ? activeAnchor === item.anchor : item.path === location.pathname && !activeAnchor
      return item.anchor ? <button key={item.id} className={active ? 'is-active' : undefined} type="button" onClick={() => openItem(item)}>{textByLocale(item.label, locale)}</button> : <Link key={item.id} className={active ? 'is-active' : undefined} to={item.path} onClick={() => { setVisible(false); setSettingsOpen(false) }}>{textByLocale(item.label, locale)}</Link>
    })}</nav>
    <div className="top-nav__actions">
      <div className="top-nav__settings-wrap">
        <button ref={settingsButtonRef} type="button" className="icon-button" onClick={() => { setVisible(true); setSettingsOpen((open) => !open) }} aria-label={textByLocale(ui['settings.label'], locale)} aria-expanded={settingsOpen} aria-controls={settingsPanelId}><Settings size={16} /></button>
        {settingsOpen && <div className="settings-popover" id={settingsPanelId} role="dialog" aria-label={textByLocale(ui['settings.title'], locale)}>
          <div className="settings-popover__header"><strong>{textByLocale(ui['settings.title'], locale)}</strong><span>{textByLocale(ui['settings.description'], locale)}</span></div>
          <div className="settings-popover__items">{SETTINGS_ITEMS.map((item) => {
            const checked = uiVisibility[item.key]
            return <button key={item.key} type="button" role="switch" aria-checked={checked} className={checked ? 'settings-toggle is-on' : 'settings-toggle'} onClick={() => toggleUiVisibility(item.key)}>
              <span><strong>{textByLocale(ui[item.labelKey], locale)}</strong><small>{textByLocale(ui[item.descriptionKey], locale)}</small></span>
              <i aria-hidden="true" />
            </button>
          })}</div>
        </div>}
      </div>
      <button type="button" className="icon-button" onClick={toggleTheme} aria-label={locale === 'zh' ? '切换主题' : 'Toggle theme'}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>
      <button type="button" className="icon-button" onClick={toggleLocale} aria-label={locale === 'zh' ? '切换语言' : 'Toggle language'}><Languages size={16} /><span>{locale === 'zh' ? '中' : 'EN'}</span></button>
    </div>
  </header>
}

