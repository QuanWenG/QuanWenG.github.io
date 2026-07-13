import MiniSearch from 'minisearch'
import type { TechStackItem } from '../types/content'
import type { ProjectItem } from '../types/project'

export interface TechGalaxySearchResult {
  itemId: string
  title: string
  group: string
  matchedText: string
  score: number
}

export interface TechGalaxySearch {
  getHint: (query: string) => string
  search: (query: string) => TechGalaxySearchResult[]
}

interface TechGalaxySearchDocument {
  id: string
  itemId: string
  title: string
  group: string
  tier: string
  description: string
  projects: string
  articles: string
  matchedText: string
  searchableText: string
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase()
}

function escapeRegExp(value: string) {
  return value.replace(/[|\\{}()[\]^$+.:]/g, '\\$&')
}

function wildcardToRegExp(value: string) {
  const pattern = [...value].map((char) => {
    if (char === '*') return '.*'
    if (char === '?') return '.'
    return escapeRegExp(char)
  }).join('')
  return new RegExp(pattern, 'i')
}

function buildDocument(item: TechStackItem, projects: ProjectItem[]): TechGalaxySearchDocument {
  const tier = item.tier || 'supporting'
  const relatedProjects = projects.filter((project) => (
    (item.projectIds || []).includes(project.id) || project.techIds.includes(item.id)
  ))
  const projectsText = relatedProjects.map((project) => [
    project.name,
    project.description,
    project.category,
    ...project.techStack,
    ...project.techIds,
  ].join(' ')).join(' ')
  const articlesText = (item.articles || []).map((article) => `${article.title.zh} ${article.title.en} ${article.slug}`).join(' ')
  const description = `${item.description.zh} ${item.description.en}`
  const searchableText = [
    item.id,
    item.name,
    item.group,
    tier,
    description,
    projectsText,
    articlesText,
  ].join(' ')

  return {
    id: item.id,
    itemId: item.id,
    title: item.name,
    group: item.group,
    tier,
    description,
    projects: projectsText,
    articles: articlesText,
    matchedText: item.group,
    searchableText,
  }
}

function findMatchedText(doc: TechGalaxySearchDocument, normalizedQuery: string, wildcard?: RegExp) {
  const fields = [doc.title, doc.id, doc.group, doc.tier, doc.projects, doc.articles, doc.description]
  const match = fields.find((field) => {
    const normalizedField = normalizeSearchText(field)
    return wildcard ? wildcard.test(field) : normalizedField.includes(normalizedQuery)
  })
  return match || doc.group
}

function toResult(doc: TechGalaxySearchDocument, score: number, normalizedQuery: string, wildcard?: RegExp): TechGalaxySearchResult {
  return {
    itemId: doc.itemId,
    title: doc.title,
    group: doc.group,
    matchedText: findMatchedText(doc, normalizedQuery, wildcard),
    score,
  }
}

function getWildcardScore(doc: TechGalaxySearchDocument, wildcard: RegExp) {
  return [doc.title, doc.itemId, doc.group].some((field) => wildcard.test(field)) ? 3 : 1.5
}

function mergeResults(results: TechGalaxySearchResult[]) {
  const byId = new Map<string, TechGalaxySearchResult>()
  for (const result of results) {
    const current = byId.get(result.itemId)
    if (!current || result.score > current.score) byId.set(result.itemId, result)
  }
  return [...byId.values()].sort((left, right) => right.score - left.score).slice(0, 8)
}

export function createTechGalaxySearch(items: TechStackItem[], projects: ProjectItem[]): TechGalaxySearch {
  const documents = items.map((item) => buildDocument(item, projects))
  const engine = new MiniSearch<TechGalaxySearchDocument>({
    fields: ['title', 'itemId', 'group', 'tier', 'description', 'projects', 'articles', 'searchableText'],
    storeFields: ['itemId', 'title', 'group', 'matchedText'],
  })
  engine.addAll(documents)

  return {
    getHint(query) {
      const normalizedQuery = normalizeSearchText(query)
      if (!normalizedQuery || normalizedQuery.includes('*') || normalizedQuery.includes('?')) return ''
      const match = documents.find((doc) => normalizeSearchText(doc.title).startsWith(normalizedQuery) && doc.title.length > query.trim().length)
        || documents.find((doc) => normalizeSearchText(doc.itemId).startsWith(normalizedQuery) && doc.itemId.length > query.trim().length)
      if (!match) return ''
      const source = normalizeSearchText(match.title).startsWith(normalizedQuery) ? match.title : match.itemId
      return source.slice(query.trim().length)
    },
    search(query) {
      const normalizedQuery = normalizeSearchText(query)
      if (!normalizedQuery) return []

      const hasWildcard = normalizedQuery.includes('*') || normalizedQuery.includes('?')
      const wildcard = hasWildcard ? wildcardToRegExp(normalizedQuery) : undefined
      const wildcardResults = wildcard
        ? documents
          .filter((doc) => wildcard.test(doc.searchableText))
          .map((doc) => toResult(doc, getWildcardScore(doc, wildcard), normalizedQuery, wildcard))
        : []
      if (hasWildcard) return mergeResults(wildcardResults)

      const miniSearchQuery = normalizedQuery.replace(/[*?]/g, ' ').trim()
      const indexedResults = miniSearchQuery
        ? engine.search(miniSearchQuery, { prefix: true, fuzzy: 0.2 }).map((result) => {
          const doc = documents.find(({ itemId }) => itemId === String(result.itemId))
          return doc ? toResult(doc, result.score, normalizedQuery, wildcard) : null
        }).filter((result): result is TechGalaxySearchResult => Boolean(result))
        : []

      const indexedIds = new Set([...wildcardResults, ...indexedResults].map(({ itemId }) => itemId))
      const substringResults = documents
        .filter((doc) => !indexedIds.has(doc.itemId) && normalizeSearchText(doc.searchableText).includes(normalizedQuery))
        .map((doc) => toResult(doc, 1, normalizedQuery))

      return mergeResults([...wildcardResults, ...indexedResults, ...substringResults])
    },
  }
}

