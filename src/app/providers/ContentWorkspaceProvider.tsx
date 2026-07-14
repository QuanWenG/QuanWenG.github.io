import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { OWNER_AUTH_CONFIG } from '../../config/auth'
import type { AppContent, BlogLibrary, ContentService } from '../../services'
import type { BlogArticle } from '../../types/blog'
import type { AnnotationMap, TechStackItem } from '../../types/content'
import type { MusicTrack } from '../../types/music'
import type { ProjectItem } from '../../types/project'
import type {
  AnnotationDraft,
  BlogArticleDraft,
  MusicTrackDraft,
  OwnerLoginInput,
  ProjectDraft,
  SessionUser,
  TechStackDraft,
  UserProfile,
  UserRole,
  WorkspaceContentKind,
  WorkspaceDraftPayload,
  WorkspaceRecord,
} from '../../types/workspace'
import { ContentWorkspaceContext, FALLBACK_SESSION_USER, type ContentWorkspaceValue } from './contentWorkspaceContext'
const OWNER_USER: SessionUser = {
  role: 'owner',
  name: OWNER_AUTH_CONFIG.ownerName,
  avatarInitial: OWNER_AUTH_CONFIG.ownerAvatarInitial,
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function slugify(value: string, fallback: string) {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9+#]+/g, '-').replace(/^-|-$/g, '')
  return slug || fallback
}

function cleanPathSegment(value: string, fallback: string) {
  const segment = value.trim().replace(/[\\/]+/g, '-').replace(/^\.+|\.+$/g, '')
  return segment || fallback
}

function mergeAnnotations(base: AnnotationMap, overlay: AnnotationMap): AnnotationMap {
  const merged: AnnotationMap = { ...base }
  for (const [sourcePath, blocks] of Object.entries(overlay)) {
    merged[sourcePath] = { ...(merged[sourcePath] || {}) }
    for (const [blockId, notes] of Object.entries(blocks)) {
      merged[sourcePath][blockId] = [...(merged[sourcePath][blockId] || []), ...notes]
    }
  }
  return merged
}

function recordTitle(kind: WorkspaceContentKind, payload: WorkspaceDraftPayload) {
  if (kind === 'tech') return (payload as TechStackDraft).name
  if (kind === 'blog') return (payload as BlogArticleDraft).title
  if (kind === 'annotation') return `批注 ${(payload as AnnotationDraft).blockId}`
  if (kind === 'project') return (payload as ProjectDraft).name
  return (payload as MusicTrackDraft).title
}

function createInitialProfile(content: AppContent): UserProfile {
  return {
    displayName: content.site.author,
    headline: content.site.title.zh,
    bio: content.site.subtitle.zh,
    location: 'Hong Kong / Remote',
    githubUrl: content.site.githubUrl,
  }
}

function toBlogMeta(article: BlogArticle) {
  return {
    id: article.id,
    title: article.title,
    category: article.category,
    sourcePath: article.sourcePath,
    slug: article.slug,
    order: article.order,
  }
}

export function ContentWorkspaceProvider({ initialContent, contentService: baseContentService, children }: {
  initialContent: AppContent
  contentService: ContentService
  children: ReactNode
}) {
  const idCounter = useRef(0)
  const [role, setRole] = useState<UserRole>('visitor')
  const [profile, setProfile] = useState<UserProfile>(() => createInitialProfile(initialContent))
  const [records, setRecords] = useState<WorkspaceRecord[]>([])
  const [techOverlay, setTechOverlay] = useState<TechStackItem[]>([])
  const [blogOverlay, setBlogOverlay] = useState<BlogArticle[]>([])
  const [annotationOverlay, setAnnotationOverlay] = useState<AnnotationMap>({})
  const [projectOverlay, setProjectOverlay] = useState<ProjectItem[]>([])
  const [musicOverlay, setMusicOverlay] = useState<MusicTrack[]>([])

  const nextId = useCallback((prefix: string) => {
    idCounter.current += 1
    return `${prefix}-${idCounter.current}`
  }, [])

  const ensureOwner = useCallback(() => {
    if (role !== 'owner') throw new Error('Owner permission is required for this action.')
  }, [role])

  const createRecord = useCallback((kind: WorkspaceContentKind, payload: WorkspaceDraftPayload, status: WorkspaceRecord['status'], targetId?: string): WorkspaceRecord => {
    const now = new Date().toISOString()
    return {
      id: nextId(`record-${kind}`),
      kind,
      status,
      title: recordTitle(kind, payload),
      targetId,
      createdAt: now,
      updatedAt: now,
      payload,
    }
  }, [nextId])

  const applyPublishedPayload = useCallback((kind: WorkspaceContentKind, payload: WorkspaceDraftPayload) => {
    if (kind === 'tech') {
      const draft = payload as TechStackDraft
      const id = slugify(draft.name, nextId('tech'))
      const item: TechStackItem = {
        id,
        name: draft.name.trim(),
        group: draft.group.trim() || 'Custom',
        description: { zh: draft.descriptionZh.trim(), en: draft.descriptionEn.trim() || draft.descriptionZh.trim() },
        color: draft.color || '#6ad7c6',
        level: clamp(Math.round(draft.level), 1, 100),
        tier: draft.tier,
        icon: 'network',
        stellarType: draft.tier === 'learning' ? 'whiteDwarf' : draft.tier === 'supporting' ? 'normal' : 'pulsar',
        projectIds: [],
      }
      setTechOverlay((items) => [...items.filter((current) => current.id !== id), item])
      return { targetId: id, title: item.name }
    }

    if (kind === 'blog') {
      const draft = payload as BlogArticleDraft
      const category = cleanPathSegment(draft.category, '未分类')
      const title = cleanPathSegment(draft.title, nextId('article'))
      const id = `${category}/${title}`
      const article: BlogArticle = {
        id,
        title: draft.title.trim(),
        category,
        sourcePath: `session/blog/${id}.md`,
        slug: id.split('/').map(encodeURIComponent).join('/'),
        order: initialContent.blogIndex.length + blogOverlay.length,
        content: draft.content.trim() || `# ${draft.title.trim()}`,
      }
      setBlogOverlay((articles) => [...articles.filter((current) => current.id !== id), article])
      return { targetId: id, title: article.title }
    }

    if (kind === 'annotation') {
      const draft = payload as AnnotationDraft
      const id = nextId('note')
      setAnnotationOverlay((current) => ({
        ...current,
        [draft.sourcePath]: {
          ...(current[draft.sourcePath] || {}),
          [draft.blockId]: [
            ...((current[draft.sourcePath] || {})[draft.blockId] || []),
            { id, content: draft.content.trim() },
          ],
        },
      }))
      return { targetId: `${draft.sourcePath}#${draft.blockId}`, title: `批注 ${draft.blockId}` }
    }

    if (kind === 'project') {
      const draft = payload as ProjectDraft
      const id = slugify(draft.name, nextId('project'))
      const linkLabel = draft.linkLabel.trim() || 'GitHub'
      const project: ProjectItem = {
        id,
        name: draft.name.trim(),
        description: draft.description.trim(),
        url: draft.url.trim() || '#',
        cover: draft.cover.trim(),
        techStack: draft.techStack,
        techIds: draft.techIds.length ? draft.techIds : draft.techStack.map((tech) => slugify(tech, 'tech')),
        category: draft.category,
        links: [{ label: linkLabel, url: draft.url.trim() || '#', repository: id }],
        github: {
          stars: 0,
          updatedAt: '',
          primaryLanguage: draft.techStack[0] || '',
          repositories: [{ name: id, url: draft.url.trim() || '#', stars: 0, updatedAt: '', primaryLanguage: draft.techStack[0] || '', archived: draft.status === 'archived' }],
        },
        featured: draft.featured,
        weight: draft.weight,
        status: draft.status,
        source: 'personal',
      }
      setProjectOverlay((projects) => [...projects.filter((current) => current.id !== id), project])
      return { targetId: id, title: project.name }
    }

    const draft = payload as MusicTrackDraft
    const id = slugify(`${draft.artist}-${draft.title}`, nextId('track'))
    const track: MusicTrack = {
      id,
      title: draft.title.trim(),
      artist: draft.artist.trim(),
      src: draft.src.trim(),
      cover: draft.cover.trim(),
      duration: draft.duration,
      accentColor: draft.accentColor || '#6ad7c6',
      tags: draft.tags,
    }
    setMusicOverlay((tracks) => [...tracks.filter((current) => current.id !== id), track])
    return { targetId: id, title: track.title }
  }, [blogOverlay.length, initialContent.blogIndex.length, nextId])

  const loginOwner = useCallback((input: OwnerLoginInput) => {
    const allowed = input.username === OWNER_AUTH_CONFIG.username && input.password === OWNER_AUTH_CONFIG.password
    if (allowed) setRole('owner')
    return allowed
  }, [])

  const logout = useCallback(() => setRole('visitor'), [])

  const updateProfile = useCallback((nextProfile: UserProfile) => {
    ensureOwner()
    setProfile(nextProfile)
  }, [ensureOwner])

  const saveDraft = useCallback((kind: WorkspaceContentKind, payload: WorkspaceDraftPayload) => {
    ensureOwner()
    const record = createRecord(kind, payload, 'draft')
    setRecords((items) => [record, ...items])
    return record
  }, [createRecord, ensureOwner])

  const publishContent = useCallback((kind: WorkspaceContentKind, payload: WorkspaceDraftPayload) => {
    ensureOwner()
    const published = applyPublishedPayload(kind, payload)
    const record = createRecord(kind, payload, 'published', published.targetId)
    const nextRecord = { ...record, title: published.title }
    setRecords((items) => [nextRecord, ...items])
    return nextRecord
  }, [applyPublishedPayload, createRecord, ensureOwner])

  const publishDraft = useCallback((recordId: string) => {
    ensureOwner()
    const record = records.find((item) => item.id === recordId && item.status === 'draft')
    if (!record) return null
    const published = applyPublishedPayload(record.kind, record.payload)
    const nextRecord = { ...record, status: 'published' as const, title: published.title, targetId: published.targetId, updatedAt: new Date().toISOString() }
    setRecords((items) => items.map((item) => item.id === recordId ? nextRecord : item))
    return nextRecord
  }, [applyPublishedPayload, ensureOwner, records])

  const content = useMemo<AppContent>(() => ({
    ...initialContent,
    techStack: [...initialContent.techStack, ...techOverlay],
    projects: [...initialContent.projects, ...projectOverlay],
    musicTracks: [...initialContent.musicTracks, ...musicOverlay],
    blogIndex: [...initialContent.blogIndex, ...blogOverlay.map(toBlogMeta)],
  }), [blogOverlay, initialContent, musicOverlay, projectOverlay, techOverlay])

  const overlayContentService = useMemo<ContentService>(() => ({
    loadAppContent: async () => content,
    async loadBlogLibrary(): Promise<BlogLibrary> {
      const base = await baseContentService.loadBlogLibrary()
      return {
        index: content.blogIndex,
        articles: [...base.articles, ...blogOverlay],
        annotations: mergeAnnotations(base.annotations, annotationOverlay),
      }
    },
    async getBlogArticle(id: string) {
      return blogOverlay.find((article) => article.id === id) || baseContentService.getBlogArticle(id)
    },
  }), [annotationOverlay, baseContentService, blogOverlay, content])

  const value = useMemo<ContentWorkspaceValue>(() => {
    const user = role === 'owner' ? OWNER_USER : FALLBACK_SESSION_USER
    return {
      content,
      contentService: overlayContentService,
      role,
      user,
      profile,
      canManageContent: role === 'owner',
      records,
      drafts: records.filter((record) => record.status === 'draft'),
      published: records.filter((record) => record.status === 'published'),
      loginOwner,
      logout,
      updateProfile,
      saveDraft,
      publishContent,
      publishDraft,
    }
  }, [content, loginOwner, logout, overlayContentService, profile, publishContent, publishDraft, records, role, saveDraft, updateProfile])

  return <ContentWorkspaceContext.Provider value={value}>{children}</ContentWorkspaceContext.Provider>
}