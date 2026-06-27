import { Languages, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import { textByLocale } from '../../services/i18n'
import type { NavigationItem } from '../../types/content'

interface TopNavigationProps {
  items: NavigationItem[]
}

export function TopNavigation({ items }: TopNavigationProps) {
  const { locale, theme, toggleLocale, toggleTheme } = usePreferences()
  const [visible, setVisible] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const openItem = (item: NavigationItem) => {
    setVisible(false)
    if (item.anchor) {
      if (location.pathname !== item.path) {
        navigate(`${item.path}#${item.anchor}`)
      } else {
        document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <header
      className={visible ? 'top-nav top-nav--visible' : 'top-nav'}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setVisible(false)
        }
      }}
    >
      <Link className="top-nav__brand" to="/" aria-label="QuanWenG home" onClick={() => setVisible(false)}>
        <span>Q</span>
        <strong>QuanWenG</strong>
      </Link>
      <nav className="top-nav__links" aria-label="Primary navigation">
        {items.filter((item) => item.showInNav).map((item) => {
          const isActive = item.path === location.pathname && !item.anchor
          if (item.anchor) {
            return (
              <button key={item.id} type="button" onClick={() => openItem(item)}>
                {textByLocale(item.label, locale)}
              </button>
            )
          }
          return (
            <Link key={item.id} className={isActive ? 'is-active' : undefined} to={item.path} onClick={() => setVisible(false)}>
              {textByLocale(item.label, locale)}
            </Link>
          )
        })}
      </nav>
      <div className="top-nav__actions">
        <button type="button" className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
        <button type="button" className="icon-button" onClick={toggleLocale} aria-label="Toggle language">
          <Languages size={16} aria-hidden="true" />
          <span>{locale === 'zh' ? '中' : 'EN'}</span>
        </button>
      </div>
    </header>
  )
}
