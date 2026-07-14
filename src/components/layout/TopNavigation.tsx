import { Languages, Lock, LogIn, Moon, Power, Settings, Sun, UserRound } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useOptionalContentWorkspace } from '../../app/providers/contentWorkspaceContext'
import { usePreferences } from '../../app/providers/usePreferences'
import type { UiVisibilityKey } from '../../app/providers/preferencesContext'
import { OWNER_AUTH_CONFIG } from '../../config/auth'
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
  const workspace = useOptionalContentWorkspace()
  const role = workspace?.role ?? 'visitor'
  const signedIn = role === 'owner'
  const brandName = signedIn ? workspace?.user.name || OWNER_AUTH_CONFIG.ownerName : (locale === 'zh' ? '登录' : 'Sign in')
  const brandInitial = workspace?.user.avatarInitial || OWNER_AUTH_CONFIG.ownerAvatarInitial
  const [visible, setVisible] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [activeAnchor, setActiveAnchor] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const lastScroll = useRef(window.scrollY)
  const idleTimer = useRef<number | undefined>(undefined)
  const navRef = useRef<HTMLElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)
  const loginButtonRef = useRef<HTMLButtonElement>(null)
  const settingsPanelId = useId()
  const loginPanelId = useId()

  useEffect(() => {
    const scheduleHide = () => {
      window.clearTimeout(idleTimer.current)
      if (settingsOpen || loginOpen) {
        setVisible(true)
        return
      }
      idleTimer.current = window.setTimeout(() => setVisible(false), NAV_IDLE_HIDE_DELAY_MS)
    }
    const onScroll = () => {
      const next = window.scrollY
      if (settingsOpen || loginOpen || next < NAV_SCROLL_TOP_VISIBILITY_PX || next < lastScroll.current - NAV_SCROLL_DIRECTION_THRESHOLD_PX) setVisible(true)
      else if (next > lastScroll.current + NAV_SCROLL_DIRECTION_THRESHOLD_PX) setVisible(false)
      lastScroll.current = next
      scheduleHide()
    }
    const onPointer = (event: PointerEvent) => { if (event.clientY < NAV_POINTER_REVEAL_ZONE_PX) setVisible(true) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    scheduleHide()
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('pointermove', onPointer); window.clearTimeout(idleTimer.current) }
  }, [loginOpen, settingsOpen])

  useEffect(() => {
    if (!settingsOpen && !loginOpen) return
    setVisible(true)
    const closeFromOutside = (event: PointerEvent) => {
      if (navRef.current?.contains(event.target as Node)) return
      setSettingsOpen(false)
      setLoginOpen(false)
    }
    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const focusLogin = loginOpen
      setSettingsOpen(false)
      setLoginOpen(false)
      if (focusLogin) loginButtonRef.current?.focus()
      else settingsButtonRef.current?.focus()
    }
    document.addEventListener('pointerdown', closeFromOutside)
    window.addEventListener('keydown', closeFromEscape)
    return () => {
      document.removeEventListener('pointerdown', closeFromOutside)
      window.removeEventListener('keydown', closeFromEscape)
    }
  }, [loginOpen, settingsOpen])

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

  const closePanels = () => {
    setSettingsOpen(false)
    setLoginOpen(false)
  }

  const openItem = (item: NavigationItem) => {
    setVisible(false)
    closePanels()
    if (!item.anchor) return
    if (location.pathname !== item.path) navigate(`${item.path}#${item.anchor}`)
    else document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('username') || '').trim()
    const password = String(formData.get('password') || '').trim()
    if (workspace?.loginOwner({ username, password })) {
      setLoginError('')
      setLoginOpen(false)
      navigate(APP_ROUTES.profile)
    } else {
      setLoginError(locale === 'zh' ? '账号或密码不正确。' : 'Username or password is incorrect.')
    }
  }

  const toggleLogin = () => {
    setVisible(true)
    setSettingsOpen(false)
    setLoginError('')
    setLoginOpen((open) => !open)
  }

  const powerAction = () => {
    closePanels()
    if (signedIn) workspace?.logout()
  }

  return <header ref={navRef} className={visible ? 'top-nav top-nav--visible' : 'top-nav'} onMouseEnter={() => setVisible(true)} onMouseLeave={() => { if (!settingsOpen && !loginOpen) setVisible(false) }} onFocus={() => setVisible(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setVisible(false); closePanels() } }}>
    <div className="top-nav__brand-wrap">
      {signedIn ? <Link className="top-nav__brand" to={APP_ROUTES.profile} aria-label={locale === 'zh' ? '进入个性信息' : 'Open profile'} onClick={() => { setVisible(false); closePanels() }}><span>{brandInitial}</span><strong>{brandName}</strong></Link> : <button ref={loginButtonRef} className="top-nav__brand" type="button" aria-label={locale === 'zh' ? '账号登录' : 'Account sign in'} aria-expanded={loginOpen} aria-controls={loginPanelId} onClick={toggleLogin}><UserRound size={18} /><strong>{brandName}</strong></button>}
      {loginOpen && <form className="login-popover" id={loginPanelId} role="dialog" aria-label={locale === 'zh' ? '账号登录' : 'Account sign in'} onSubmit={submitLogin}>
        <div className="login-popover__header"><strong>{locale === 'zh' ? '账号登录' : 'Account sign in'}</strong></div>
        <label><UserRound size={16} />{locale === 'zh' ? '账号' : 'Username'}<input name="username" defaultValue={OWNER_AUTH_CONFIG.username} autoComplete="username" required /></label>
        <label><Lock size={16} />{locale === 'zh' ? '密码' : 'Password'}<input name="password" type="password" defaultValue={OWNER_AUTH_CONFIG.password} autoComplete="current-password" required /></label>
        <button className="primary-link" type="submit"><LogIn size={16} />{locale === 'zh' ? '登录' : 'Sign in'}</button>
        {loginError && <p role="alert">{loginError}</p>}
      </form>}
    </div>
    <nav className="top-nav__links" aria-label="Primary navigation">{items.filter((item) => item.showInNav).map((item) => {
      const active = item.anchor ? activeAnchor === item.anchor : item.path === location.pathname && !activeAnchor
      return item.anchor ? <button key={item.id} className={active ? 'is-active' : undefined} type="button" onClick={() => openItem(item)}>{textByLocale(item.label, locale)}</button> : <Link key={item.id} className={active ? 'is-active' : undefined} to={item.path} onClick={() => { setVisible(false); closePanels() }}>{textByLocale(item.label, locale)}</Link>
    })}</nav>
    <div className="top-nav__actions">
      <button type="button" className="icon-button" onClick={powerAction} disabled={!signedIn} aria-label={signedIn ? (locale === 'zh' ? '退出登录' : 'Sign out') : (locale === 'zh' ? '未登录' : 'Signed out')}><Power size={16} /></button>
      <div className="top-nav__settings-wrap">
        <button ref={settingsButtonRef} type="button" className="icon-button" onClick={() => { setVisible(true); setLoginOpen(false); setSettingsOpen((open) => !open) }} aria-label={textByLocale(ui['settings.label'], locale)} aria-expanded={settingsOpen} aria-controls={settingsPanelId}><Settings size={16} /></button>
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