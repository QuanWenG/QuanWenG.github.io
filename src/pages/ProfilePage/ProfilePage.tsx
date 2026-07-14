import { CheckCircle2, FileText, Send, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePreferences } from '../../app/providers/usePreferences'
import { useContentWorkspace } from '../../app/providers/contentWorkspaceContext'
import { APP_ROUTES } from '../../config/routes'
import type { ProjectCategory, ProjectStatus } from '../../types/project'
import type { WorkspaceContentKind, WorkspaceDraftPayload, WorkspaceRecord } from '../../types/workspace'
import './ProfilePage.css'

type ComposerKind = WorkspaceContentKind

type SubmitIntent = 'draft' | 'publish'

const COMPOSERS: Array<{ kind: ComposerKind; zh: string; en: string }> = [
  { kind: 'tech', zh: '技术栈', en: 'Technology' },
  { kind: 'blog', zh: '博客', en: 'Blog' },
  { kind: 'annotation', zh: '批注', en: 'Annotation' },
  { kind: 'project', zh: '项目', en: 'Project' },
  { kind: 'music', zh: '音乐', en: 'Music' },
]

const PROJECT_CATEGORIES: ProjectCategory[] = ['ai', 'fullstack', 'backend', 'plugin', 'game', 'tooling']
const PROJECT_STATUSES: ProjectStatus[] = ['active', 'draft', 'archived']

function t(locale: 'zh' | 'en', zh: string, en: string) {
  return locale === 'zh' ? zh : en
}

function formString(formData: FormData, name: string) {
  return String(formData.get(name) || '').trim()
}

function formNumber(formData: FormData, name: string, fallback: number) {
  const value = Number(formData.get(name))
  return Number.isFinite(value) ? value : fallback
}

function splitList(value: string) {
  return value.split(/[，,\n]/).map((item) => item.trim()).filter(Boolean)
}

function submitIntent(event: FormEvent<HTMLFormElement>): SubmitIntent {
  const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
  return submitter?.value === 'draft' ? 'draft' : 'publish'
}

function kindLabel(kind: WorkspaceContentKind, locale: 'zh' | 'en') {
  return COMPOSERS.find((item) => item.kind === kind)?.[locale] || kind
}

function RecordList({ title, records, locale, onPublishDraft }: { title: string; records: WorkspaceRecord[]; locale: 'zh' | 'en'; onPublishDraft?: (id: string) => void }) {
  return <section className="profile-records" aria-label={title}>
    <h2>{title}</h2>
    {records.length ? <div className="profile-records__list">{records.map((record) => <article key={record.id} className="profile-record">
      <span>{kindLabel(record.kind, locale)}</span>
      <strong>{record.title}</strong>
      <small>{new Date(record.updatedAt).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</small>
      {record.status === 'draft' && onPublishDraft && <button className="secondary-link" type="button" onClick={() => onPublishDraft(record.id)}><Send size={15} />{t(locale, '发布', 'Publish')}</button>}
    </article>)}</div> : <p className="profile-empty">{t(locale, '当前会话里还没有内容。', 'No content in this session yet.')}</p>}
  </section>
}

function ActionButtons({ locale }: { locale: 'zh' | 'en' }) {
  return <div className="profile-form__actions">
    <button className="secondary-link" name="intent" value="draft" type="submit"><FileText size={16} />{t(locale, '保存草稿', 'Save draft')}</button>
    <button className="primary-link" name="intent" value="publish" type="submit"><Send size={16} />{t(locale, '发布', 'Publish')}</button>
  </div>
}

export function ProfilePage() {
  const { locale } = usePreferences()
  const workspace = useContentWorkspace()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedComposer = searchParams.get('compose') as ComposerKind | null
  const [activeComposer, setActiveComposer] = useState<ComposerKind>(COMPOSERS.some((item) => item.kind === requestedComposer) ? requestedComposer || 'tech' : 'tech')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (requestedComposer && COMPOSERS.some((item) => item.kind === requestedComposer)) setActiveComposer(requestedComposer)
  }, [requestedComposer])

  const sourceSummary = useMemo(() => {
    const config = workspace.content.projectSourceConfig
    const repositories = config.projects.reduce((count, project) => count + project.repositories.length, 0)
    return { owner: config.owner, projects: config.projects.length, repositories }
  }, [workspace.content.projectSourceConfig])

  const commit = (kind: WorkspaceContentKind, payload: WorkspaceDraftPayload, intent: SubmitIntent, form: HTMLFormElement) => {
    if (intent === 'draft') workspace.saveDraft(kind, payload)
    else workspace.publishContent(kind, payload)
    setNotice(intent === 'draft' ? t(locale, '已保存到本次会话草稿箱。', 'Saved to the session draft box.') : t(locale, '已发布到当前页面数据。', 'Published into the current page data.'))
    form.reset()
  }

  const handleProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    workspace.updateProfile({
      ...workspace.profile,
      displayName: formString(formData, 'displayName'),
      bio: formString(formData, 'bio'),
      githubUrl: formString(formData, 'githubUrl'),
    })
    setNotice(t(locale, '个人信息已在当前会话中更新。', 'Profile updated in this session.'))
  }

  const handleTech = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    commit('tech', {
      name: formString(formData, 'name'),
      group: formString(formData, 'group'),
      descriptionZh: formString(formData, 'descriptionZh'),
      descriptionEn: formString(formData, 'descriptionEn'),
      color: formString(formData, 'color') || '#6ad7c6',
      level: formNumber(formData, 'level', 70),
      tier: (formString(formData, 'tier') || 'learning') as 'primary' | 'supporting' | 'learning',
    }, submitIntent(event), event.currentTarget)
  }

  const handleBlog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    commit('blog', {
      title: formString(formData, 'title'),
      category: formString(formData, 'category'),
      content: formString(formData, 'content'),
    }, submitIntent(event), event.currentTarget)
  }

  const handleAnnotation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const articleId = formString(formData, 'articleId')
    const article = workspace.content.blogIndex.find((item) => item.id === articleId)
    commit('annotation', {
      articleId,
      sourcePath: article?.sourcePath || formString(formData, 'sourcePath'),
      blockId: formString(formData, 'blockId'),
      content: formString(formData, 'content'),
    }, submitIntent(event), event.currentTarget)
  }

  const handleProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    commit('project', {
      name: formString(formData, 'name'),
      description: formString(formData, 'description'),
      url: formString(formData, 'url'),
      category: (formString(formData, 'category') || 'tooling') as ProjectCategory,
      techStack: splitList(formString(formData, 'techStack')),
      techIds: splitList(formString(formData, 'techIds')),
      cover: formString(formData, 'cover'),
      featured: formData.get('featured') === 'on',
      weight: formNumber(formData, 'weight', 50),
      status: (formString(formData, 'status') || 'active') as ProjectStatus,
      linkLabel: formString(formData, 'linkLabel') || 'GitHub',
    }, submitIntent(event), event.currentTarget)
  }

  const handleMusic = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const duration = formNumber(formData, 'duration', 0)
    commit('music', {
      title: formString(formData, 'title'),
      artist: formString(formData, 'artist'),
      src: formString(formData, 'src'),
      cover: formString(formData, 'cover'),
      duration: duration > 0 ? duration : undefined,
      accentColor: formString(formData, 'accentColor') || '#6ad7c6',
      tags: splitList(formString(formData, 'tags')),
    }, submitIntent(event), event.currentTarget)
  }

  const renderComposer = () => {
    if (!workspace.canManageContent) return null
    if (activeComposer === 'tech') return <form className="profile-form" onSubmit={handleTech}>
      <label>{t(locale, '技术名称', 'Technology name')}<input name="name" required placeholder="Rust" /></label>
      <label>{t(locale, '分组', 'Group')}<input name="group" required placeholder="Language" /></label>
      <label>{t(locale, '中文描述', 'Chinese description')}<textarea name="descriptionZh" required rows={3} /></label>
      <label>{t(locale, '英文描述', 'English description')}<textarea name="descriptionEn" rows={3} /></label>
      <div className="profile-form__grid"><label>{t(locale, '颜色', 'Color')}<input name="color" type="color" defaultValue="#6ad7c6" /></label><label>{t(locale, '等级', 'Level')}<input name="level" type="number" min="1" max="100" defaultValue="70" /></label></div>
      <label>{t(locale, '层级', 'Tier')}<select name="tier" defaultValue="learning"><option value="primary">primary</option><option value="supporting">supporting</option><option value="learning">learning</option></select></label>
      <ActionButtons locale={locale} />
    </form>

    if (activeComposer === 'blog') return <form className="profile-form" onSubmit={handleBlog}>
      <label>{t(locale, '标题', 'Title')}<input name="title" required /></label>
      <label>{t(locale, '分类', 'Category')}<input name="category" required placeholder="前端" /></label>
      <label>{t(locale, 'Markdown 正文', 'Markdown content')}<textarea name="content" required rows={10} placeholder="# Title" /></label>
      <ActionButtons locale={locale} />
    </form>

    if (activeComposer === 'annotation') return <form className="profile-form" onSubmit={handleAnnotation}>
      <label>{t(locale, '文章', 'Article')}<select name="articleId" required>{workspace.content.blogIndex.map((article) => <option key={article.id} value={article.id}>{article.category} / {article.title}</option>)}</select></label>
      <label>{t(locale, '内容块 ID', 'Block id')}<input name="blockId" required placeholder="b-paragraph-3" /></label>
      <label>{t(locale, '批注内容', 'Annotation')}<textarea name="content" required rows={4} /></label>
      <ActionButtons locale={locale} />
    </form>

    if (activeComposer === 'project') return <form className="profile-form" onSubmit={handleProject}>
      <label>{t(locale, '项目名称', 'Project name')}<input name="name" required /></label>
      <label>{t(locale, '描述', 'Description')}<textarea name="description" required rows={3} /></label>
      <label>{t(locale, '项目地址', 'Project URL')}<input name="url" required placeholder="https://github.com/..." /></label>
      <div className="profile-form__grid"><label>{t(locale, '分类', 'Category')}<select name="category" defaultValue="tooling">{PROJECT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><label>{t(locale, '状态', 'Status')}<select name="status" defaultValue="active">{PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label></div>
      <label>{t(locale, '技术栈', 'Tech stack')}<input name="techStack" required placeholder="React, TypeScript" /></label>
      <label>{t(locale, '技术 ID', 'Tech ids')}<input name="techIds" placeholder="react, typescript" /></label>
      <label>{t(locale, '封面路径', 'Cover path')}<input name="cover" placeholder="media/projects/example.jpg" /></label>
      <div className="profile-form__grid"><label>{t(locale, '链接名称', 'Link label')}<input name="linkLabel" defaultValue="GitHub" /></label><label>{t(locale, '权重', 'Weight')}<input name="weight" type="number" defaultValue="50" /></label></div>
      <label className="profile-check"><input name="featured" type="checkbox" />{t(locale, '精选项目', 'Featured project')}</label>
      <ActionButtons locale={locale} />
    </form>

    return <form className="profile-form" onSubmit={handleMusic}>
      <label>{t(locale, '歌曲标题', 'Track title')}<input name="title" required /></label>
      <label>{t(locale, '作者', 'Artist')}<input name="artist" required /></label>
      <label>{t(locale, '音频地址', 'Audio source')}<input name="src" required placeholder="media/music/song.mp3" /></label>
      <label>{t(locale, '封面地址', 'Cover')}<input name="cover" placeholder="media/music/cover.jpg" /></label>
      <div className="profile-form__grid"><label>{t(locale, '时长秒数', 'Duration seconds')}<input name="duration" type="number" min="0" /></label><label>{t(locale, '主题色', 'Accent color')}<input name="accentColor" type="color" defaultValue="#6ad7c6" /></label></div>
      <label>{t(locale, '标签', 'Tags')}<input name="tags" placeholder="lofi, reading" /></label>
      <ActionButtons locale={locale} />
    </form>
  }

  return <section className="content-page profile-page" aria-labelledby="profile-title">
    <header className="content-page__header profile-hero">
      <h1 id="profile-title">{t(locale, '个性信息', 'Profile')}</h1>
    </header>

    <div className="profile-layout">
      <aside className="profile-side">
        <div className="profile-identity profile-brand">
          <span>{workspace.user.avatarInitial}</span>
          <strong>{workspace.profile.displayName}</strong>
        </div>
        <p>{workspace.profile.bio}</p>
        <a href={workspace.profile.githubUrl} target="_blank" rel="noreferrer">{t(locale, 'GitHub 主页', 'GitHub profile')}</a>
      </aside>

      <div className="profile-main">
        {notice && <div className="profile-notice" role="status"><CheckCircle2 size={18} />{notice}</div>}
        <section className="profile-section">
          <div className="profile-section__heading"><UserRound /><h2>{t(locale, '个人信息', 'Personal info')}</h2></div>
          <form className="profile-info-form" onSubmit={handleProfile}>
            <label>{t(locale, '显示名称', 'Display name')}<input name="displayName" defaultValue={workspace.profile.displayName} disabled={!workspace.canManageContent} required /></label>
            <label>{t(locale, '简介', 'Bio')}<textarea name="bio" defaultValue={workspace.profile.bio} disabled={!workspace.canManageContent} rows={4} required /></label>
            <label>GitHub<input name="githubUrl" defaultValue={workspace.profile.githubUrl} disabled={!workspace.canManageContent} type="url" required /></label>
            {workspace.canManageContent && <button className="primary-link" type="submit"><CheckCircle2 size={16} />{t(locale, '保存个人信息', 'Save profile')}</button>}
          </form>
        </section>

        {workspace.canManageContent && <>
          <section className="profile-section">
            <div className="profile-section__heading"><FileText /><h2>{t(locale, '添加内容', 'Add content')}</h2></div>
            <div className="profile-composer-tabs">{COMPOSERS.map((item) => <button key={item.kind} type="button" className={activeComposer === item.kind ? 'is-active' : undefined} onClick={() => { setActiveComposer(item.kind); setSearchParams({ compose: item.kind }) }}>{item[locale]}</button>)}</div>
            {renderComposer()}
          </section>

          <section className="profile-source profile-section">
            <h2>{t(locale, '项目获取源配置', 'Project source config')}</h2>
            <dl><div><dt>Owner</dt><dd>{sourceSummary.owner}</dd></div><div><dt>{t(locale, '项目', 'Projects')}</dt><dd>{sourceSummary.projects}</dd></div><div><dt>{t(locale, '仓库', 'Repositories')}</dt><dd>{sourceSummary.repositories}</dd></div></dl>
          </section>

          <div className="profile-record-grid">
            <RecordList title={t(locale, '草稿箱', 'Drafts')} records={workspace.drafts} locale={locale} onPublishDraft={(id) => { workspace.publishDraft(id); setNotice(t(locale, '草稿已发布。', 'Draft published.')) }} />
            <RecordList title={t(locale, '已发布', 'Published')} records={workspace.published} locale={locale} />
          </div>
        </>}
      </div>
    </div>

    <Link className="profile-home-link secondary-link" to={APP_ROUTES.home}>{t(locale, '返回首页', 'Back home')}</Link>
  </section>
}