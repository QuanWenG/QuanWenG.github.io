import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { IcpRecordFooter } from './IcpRecordFooter'

const author = 'QuanWenG'

describe('IcpRecordFooter', () => {
  afterEach(cleanup)

  it('renders the configured ICP record with the default MIIT link', () => {
    render(<IcpRecordFooter site={{ author, compliance: { icp: { number: '京ICP备00000000号-1' } } }} />)

    expect(screen.getByRole('contentinfo', { name: 'ICP备案信息' })).toBeInTheDocument()
    expect(screen.getByText(/Copyright © \d{4} QuanWenG/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '京ICP备00000000号-1' })).toHaveAttribute('href', 'https://beian.miit.gov.cn/')
    expect(screen.queryByText(/公网安备/)).not.toBeInTheDocument()
  })

  it('renders public security filing only when it is configured', () => {
    render(<IcpRecordFooter site={{
      author,
      compliance: {
        icp: { number: '京ICP备00000000号-1', href: 'https://example.com/icp' },
        publicSecurity: { number: '京公网安备11010502036963号', href: 'https://example.com/mps' },
      },
    }} />)

    expect(screen.getByRole('link', { name: '京ICP备00000000号-1' })).toHaveAttribute('href', 'https://example.com/icp')
    expect(screen.getByRole('link', { name: '京公网安备11010502036963号' })).toHaveAttribute('href', 'https://example.com/mps')
  })

  it('does not render without an ICP record', () => {
    const { container } = render(<IcpRecordFooter site={{ author }} />)

    expect(container.firstChild).toBeNull()
  })
})
