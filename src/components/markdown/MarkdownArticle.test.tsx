import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import annotations from '../../data/annotations.json'
import { getLocalBlogArticle } from '../../services/blogContent'
import type { AnnotationMap } from '../../types/content'
import { MarkdownArticle } from './MarkdownArticle'

describe('MarkdownArticle', () => {
  afterEach(cleanup)
  it('assigns structural block ids and displays annotation counts', async () => {
    const onSelect = vi.fn()
    render(<MarkdownArticle content="A paragraph" sourcePath="note.md" annotations={{ 'note.md': { 'b-paragraph-0': [{ id: '1', content: 'note' }] } }} onSelectBlock={onSelect} />)
    const button = await screen.findByRole('button', { name: 'Annotations: 1' })
    expect(button).toHaveTextContent('1')
    fireEvent.click(button)
    expect(onSelect).toHaveBeenCalledWith('b-paragraph-0')
  })

  it('matches the checked-in annotation to the real Java article block', async () => {
    const article = getLocalBlogArticle('java/java基础')
    expect(article).not.toBeNull()
    render(<MarkdownArticle content={article?.content || ''} sourcePath={article?.sourcePath || ''} annotations={annotations as AnnotationMap} onSelectBlock={() => undefined} />)
    expect(await screen.findByRole('button', { name: 'Annotations: 1' })).toBeInTheDocument()
  })
})