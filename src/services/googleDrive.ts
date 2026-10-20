import type { DriveFileItem, SyncState } from '../types'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3'

export async function listDriveEbooks(accessToken: string): Promise<DriveFileItem[]> {
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

  const res = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) {
    throw new Error(`Không thể lấy danh sách file từ Google Drive: ${res.statusText}`)
  }

  const data = await res.json()
  return (data.files || []) as DriveFileItem[]
}

export async function downloadDriveFile(
  accessToken: string,
  fileId: string
): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
  const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

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

export async function findSyncFileId(accessToken: string): Promise<string | null> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name = '${SYNC_FILE_NAME}' and trashed = false`,
    fields: 'files(id, name)',
    pageSize: '1',
  })

  const res = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!res.ok) return null
  const data = await res.json()
  if (data.files && data.files.length > 0) {
    return data.files[0].id
  }
  return null
}

export async function getSyncStateFromDrive(accessToken: string): Promise<SyncState | null> {
  try {
    const fileId = await findSyncFileId(accessToken)
    if (!fileId) return null

    const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!res.ok) return null
    return (await res.json()) as SyncState
  } catch (err) {
    console.warn('Lỗi khi đọc sync_state.json từ Google Drive appDataFolder:', err)
    return null
  }
}

export async function saveSyncStateToDrive(
  accessToken: string,
  state: SyncState
): Promise<void> {
  try {
    const fileId = await findSyncFileId(accessToken)
    const content = JSON.stringify(state, null, 2)
    const blob = new Blob([content], { type: 'application/json' })

    if (fileId) {
      // Update existing file
      await fetch(`${UPLOAD_API_BASE}/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: blob,
      })
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

      await fetch(`${UPLOAD_API_BASE}/files?uploadType=multipart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      })
    }
  } catch (err) {
    console.error('Lỗi khi lưu sync_state.json lên Google Drive:', err)
  }
}
