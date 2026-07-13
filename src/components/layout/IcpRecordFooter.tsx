import type { SiteConfig } from '../../types/content'

const DEFAULT_ICP_HREF = 'https://beian.miit.gov.cn/'
const DEFAULT_PUBLIC_SECURITY_HREF = 'https://beian.mps.gov.cn/#/query/webSearch'

interface IcpRecordFooterProps {
  site: Pick<SiteConfig, 'author' | 'compliance'>
}

export function IcpRecordFooter({ site }: IcpRecordFooterProps) {
  const icpNumber = site.compliance?.icp?.number.trim()

  if (!icpNumber) {
    return null
  }

  const publicSecurityNumber = site.compliance?.publicSecurity?.number.trim()
  const year = new Date().getFullYear()

  return (
    <footer className="icp-footer" aria-label="ICP备案信息">
      <div className="icp-footer__legal">
        <span>Copyright © {year} {site.author}</span>
        <span className="icp-footer__separator" aria-hidden="true">|</span>
        <a href={site.compliance?.icp?.href || DEFAULT_ICP_HREF} target="_blank" rel="noreferrer">
          {icpNumber}
        </a>
        {publicSecurityNumber ? (
          <>
            <span className="icp-footer__separator" aria-hidden="true">|</span>
            <a href={site.compliance?.publicSecurity?.href || DEFAULT_PUBLIC_SECURITY_HREF} target="_blank" rel="noreferrer">
              {publicSecurityNumber}
            </a>
          </>
        ) : null}
      </div>
    </footer>
  )
}