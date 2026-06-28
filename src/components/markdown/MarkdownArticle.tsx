import { MessageCircle } from 'lucide-react'
import { createElement, type HTMLAttributes, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import type { AnnotationMap } from '../../types/content'
import { remarkCommentableBlocks } from './remarkCommentableBlocks'

interface MarkdownArticleProps {
  content: string
  sourcePath: string
  annotations: AnnotationMap
  onSelectBlock: (blockId: string) => void
}

type MarkdownElementProps = HTMLAttributes<HTMLElement> & { node?: unknown; children?: ReactNode; 'data-block-id'?: string }

export function MarkdownArticle({ content, sourcePath, annotations, onSelectBlock }: MarkdownArticleProps) {
  const notes = annotations[sourcePath] || {}
  const bubble = (blockId: string) => {
    const count = notes[blockId]?.length || 0
    return <button className={count ? 'annotation-bubble has-notes' : 'annotation-bubble'} type="button" onClick={() => onSelectBlock(blockId)} aria-label={`Annotations: ${count}`}><MessageCircle aria-hidden="true" /><span>{count > 99 ? '99+' : count}</span></button>
  }
  const wrap = (tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'pre') => {
    return function CommentableComponent({ children, node: _node, ...props }: MarkdownElementProps) {
      const blockId = props['data-block-id'] || ''
      const element = createElement(tag, props, children)
      return blockId ? <div className="commentable-block" data-commentable-id={blockId}>{element}{bubble(blockId)}</div> : element
    }
  }
  const ListItem = ({ children, node: _node, ...props }: MarkdownElementProps) => {
    const blockId = props['data-block-id'] || ''
    if (!blockId) return <li {...props}>{children}</li>
    return <li {...props}><div className="commentable-block" data-commentable-id={blockId}><div>{children}</div>{bubble(blockId)}</div></li>
  }
  const components = {
    h1: wrap('h1'), h2: wrap('h2'), h3: wrap('h3'), h4: wrap('h4'), h5: wrap('h5'), h6: wrap('h6'), p: wrap('p'), li: ListItem, pre: wrap('pre'),
  } as Components
  return <ReactMarkdown remarkPlugins={[remarkGfm, remarkCommentableBlocks]} rehypePlugins={[rehypeSlug]} components={components}>{content}</ReactMarkdown>
}