import { ChevronDown } from 'lucide-react'
import type { MouseEvent } from 'react'

interface ScrollCueProps {
  targetId?: string
}

export function ScrollCue({ targetId = 'tech-stack' }: ScrollCueProps) {
  const scrollToTarget = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <a className="scroll-cue" href={`#${targetId}`} onClick={scrollToTarget} aria-label="Scroll to tech stack">
      <ChevronDown aria-hidden="true" size={22} strokeWidth={1.8} />
    </a>
  )
}
