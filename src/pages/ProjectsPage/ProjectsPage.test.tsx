import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PreferencesProvider } from '../../app/providers/PreferencesProvider'
import projectsData from '../../data/projects.json'
import uiData from '../../data/ui.json'
import type { UiCopy } from '../../types/content'
import type { ProjectItem } from '../../types/project'
import { ProjectsPage } from './ProjectsPage'

function renderPage() {
  return render(<MemoryRouter><PreferencesProvider><ProjectsPage ui={uiData as UiCopy} projects={projectsData as ProjectItem[]} /></PreferencesProvider></MemoryRouter>)
}

describe('ProjectsPage masonry', () => {
  afterEach(cleanup)

  it('renders every project in top-aligned waterfall lanes without filter or stats UI', () => {
    const { container } = renderPage()
    const lanes = [...container.querySelectorAll<HTMLElement>('.project-waterfall__lane')]
    expect(lanes).toHaveLength(3)
    expect(container.querySelectorAll('.project-waterfall__lane > .project-card')).toHaveLength(projectsData.length)
    expect(lanes.every((lane) => lane.style.paddingTop === '')).toBe(true)
    expect(screen.queryByText('精选项目')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '全部' })).not.toBeInTheDocument()
    expect(screen.queryByText('查看 GitHub 主页')).not.toBeInTheDocument()
  })

  it('uses stable varied cover heights for an asymmetric layout', () => {
    const { container } = renderPage()
    const heights = new Set([...container.querySelectorAll<HTMLElement>('.project-card__cover')].map((cover) => cover.style.getPropertyValue('--project-cover-height')))
    expect(heights.size).toBeGreaterThan(1)
  })

  it('keeps all repository links for project suites', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /项目总仓/ })).toHaveAttribute('href', 'https://github.com/QuanWenG/cloud-link')
    expect(screen.getByRole('link', { name: /React 前端/ })).toHaveAttribute('href', 'https://github.com/QuanWenG/cloud-link-front')
    expect(screen.getByRole('link', { name: /Kotlin 后端/ })).toHaveAttribute('href', 'https://github.com/QuanWenG/cloud-link-backend')
  })
})