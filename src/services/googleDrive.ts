import type { DriveFileItem, SyncState } from '../types'
import { useAuthStore } from '../store/useAuthStore'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3'

/**
 * Authenticated fetch helper for Google Drive API with automatic token refresh on 401.
 */
async function driveAuthFetch(
  url: string,
  options: RequestInit = {},
  fallbackToken?: string
): Promise<Response> {
  let token = fallbackToken
  if (!token) {
    token = (await useAuthStore.getState().getValidAccessToken()) || undefined
  }

  const headers = new Headers(options.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let res = await fetch(url, { ...options, headers })

  // If token has expired, silently refresh and retry once
  if (res.status === 401) {
    const newToken = await useAuthStore.getState().refreshAccessToken()
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`)
      res = await fetch(url, { ...options, headers })
    }
  }

  return res
}

export async function listDriveEbooks(accessToken?: string): Promise<DriveFileItem[]> {
  const query = [
    "trashed = false",
    "(mimeType = 'application/epub+zip' or " +
      "mimeType = 'application/pdf' or " +
      "name contains '.epub' or " +
      "name contains '.pdf' or " +
      "name contains '.mobi' or " +
      "name contains '.azw' or " +
      "name contains '.azw3' or " +
      "name contains '.cbz' or " +
      "name contains '.txt')",
  ].join(' and ')

  const params = new URLSearchParams({
    q: query,
    fields: 'files(id, name, mimeType, size, thumbnailLink, modifiedTime, iconLink)',
    pageSize: '100',
    orderBy: 'modifiedTime desc',
  })

  const res = await driveAuthFetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {}, accessToken)

  if (!res.ok) {
    throw new Error(`Không thể lấy danh sách file từ Google Drive: ${res.statusText}`)
  }

  const data = await res.json()
  return (data.files || []) as DriveFileItem[]
}

export async function downloadDriveFile(
  accessToken?: string,
  fileId?: string
): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
  const targetId = fileId || accessToken // support both signatures
  const token = fileId ? accessToken : undefined

  const res = await driveAuthFetch(`${DRIVE_API_BASE}/files/${targetId}?alt=media`, {}, token)

  if (!res.ok) {
    throw new Error(`Tải tệp từ Google Drive thất bại: ${res.statusText}`)
  }

  const mimeType = res.headers.get('content-type') || 'application/octet-stream'
  const buffer = await res.arrayBuffer()
  return { buffer, mimeType }
}

// -------------------------------------------------------------
// Google Drive appDataFolder Sync
// -------------------------------------------------------------
const SYNC_FILE_NAME = 'sync_state.json'

export async function findSyncFileId(accessToken?: string): Promise<string | null> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name = '${SYNC_FILE_NAME}' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: '1',
  })

  const res = await driveAuthFetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {}, accessToken)

  if (!res.ok) return null
  const data = await res.json()
  if (data.files && data.files.length > 0) {
    return data.files[0].id
  }
  return null
}

export async function getSyncStateFromDrive(accessToken?: string): Promise<SyncState | null> {
  try {
    const fileId = await findSyncFileId(accessToken)
    if (!fileId) return null

    const res = await driveAuthFetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {}, accessToken)

    if (!res.ok) return null
    return (await res.json()) as SyncState
  } catch (err) {
    console.warn('Lỗi khi đọc sync_state.json từ Google Drive appDataFolder:', err)
    return null
  }
}

export async function saveSyncStateToDrive(
  accessToken: string | undefined,
  state: SyncState
): Promise<void> {
  try {
    const fileId = await findSyncFileId(accessToken)
    const content = JSON.stringify(state, null, 2)
    const blob = new Blob([content], { type: 'application/json' })

    if (fileId) {
      // Update existing file
      await driveAuthFetch(
        `${UPLOAD_API_BASE}/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: blob,
        },
        accessToken
      )
    } else {
      // Create new file inside appDataFolder
      const metadata = {
        name: SYNC_FILE_NAME,
        parents: ['appDataFolder'],
        mimeType: 'application/json',
      }

      const form = new FormData()
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      )
      form.append('file', blob)

      await driveAuthFetch(
        `${UPLOAD_API_BASE}/files?uploadType=multipart`,
        {
          method: 'POST',
          body: form,
        },
        accessToken
      )
    }
  } catch (err) {
    console.error('Lỗi khi lưu sync_state.json lên Google Drive:', err)
  }
}
