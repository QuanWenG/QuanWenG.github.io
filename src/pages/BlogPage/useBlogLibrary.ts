import { useCallback, useEffect, useState } from 'react'
import type { ContentService } from '../../services'
import type { BlogArticle } from '../../types/blog'
import type { AnnotationMap } from '../../types/content'

type LoadStatus = 'loading' | 'ready' | 'error'

export function useBlogLibrary(contentService: ContentService, articleId: string) {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [index, setIndex] = useState<Awaited<ReturnType<ContentService['loadBlogLibrary']>>['index']>([])
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [annotations, setAnnotations] = useState<AnnotationMap>({})
  const [activeArticle, setActiveArticle] = useState<BlogArticle | null>(null)
  const [articleStatus, setArticleStatus] = useState<LoadStatus>('ready')

  useEffect(() => {
    let active = true
    setStatus('loading')
    void contentService.loadBlogLibrary().then(
      (library) => {
        if (!active) return
        setIndex(library.index)
        setArticles(library.articles)
        setAnnotations(library.annotations)
        setStatus('ready')
      },
      () => {
        if (active) setStatus('error')
      },
    )
    return () => {
      active = false
    }
  }, [attempt, contentService])

  useEffect(() => {
    let active = true
    if (status !== 'ready') {
      return () => {
        active = false
      }
    }
    if (!articleId) {
      setActiveArticle(null)
      setArticleStatus('ready')
      return () => {
        active = false
      }
    }

    const loaded = articles.find((article) => article.id === articleId)
    if (loaded) {
      setActiveArticle(loaded)
      setArticleStatus('ready')
      return () => {
        active = false
      }
    }

    setActiveArticle(null)
    setArticleStatus('loading')
    void contentService.getBlogArticle(articleId).then(
      (article) => {
        if (!active) return
        setActiveArticle(article)
        setArticleStatus(article ? 'ready' : 'error')
      },
      () => {
        if (active) setArticleStatus('error')
      },
    )
    return () => {
      active = false
    }
  }, [articleId, articles, contentService, status])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  return { status, articleStatus, index, articles, annotations, activeArticle, retry }
}
