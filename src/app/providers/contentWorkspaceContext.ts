import { createContext, useContext } from 'react'
import type { AppContent, ContentService } from '../../services'
import type { OwnerLoginInput, SessionUser, UserProfile, UserRole, WorkspaceContentKind, WorkspaceDraftPayload, WorkspaceRecord } from '../../types/workspace'

export const FALLBACK_SESSION_USER: SessionUser = {
  role: 'visitor',
  name: '登录',
  avatarInitial: 'Q',
}

export interface ContentWorkspaceValue {
  content: AppContent
  contentService: ContentService
  role: UserRole
  user: SessionUser
  profile: UserProfile
  canManageContent: boolean
  records: WorkspaceRecord[]
  drafts: WorkspaceRecord[]
  published: WorkspaceRecord[]
  loginOwner: (input: OwnerLoginInput) => boolean
  logout: () => void
  updateProfile: (profile: UserProfile) => void
  saveDraft: (kind: WorkspaceContentKind, payload: WorkspaceDraftPayload) => WorkspaceRecord
  publishContent: (kind: WorkspaceContentKind, payload: WorkspaceDraftPayload) => WorkspaceRecord
  publishDraft: (recordId: string) => WorkspaceRecord | null
}

export const ContentWorkspaceContext = createContext<ContentWorkspaceValue | null>(null)

export function useContentWorkspace() {
  const value = useOptionalContentWorkspace()
  if (!value) throw new Error('useContentWorkspace must be used inside ContentWorkspaceProvider')
  return value
}

export function useOptionalContentWorkspace() {
  return useContext(ContentWorkspaceContext)
}