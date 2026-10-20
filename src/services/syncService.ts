import {
  saveReadingProgress,
  getReadingProgress,
  getAllReadingProgress,
} from '../db'
import {
  getSyncStateFromDrive,
  saveSyncStateToDrive,
} from './googleDrive'
import type { ReadingProgress, SyncState } from '../types'
import { useAuthStore } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'

let syncTimeout: ReturnType<typeof setTimeout> | null = null

export async function recordReadingProgress(progress: ReadingProgress): Promise<void> {
  // 1. Always save to local IndexedDB immediately
  await saveReadingProgress(progress)

  // 2. Debounce cloud sync to Google Drive appDataFolder (2.5 seconds)
  if (syncTimeout) {
    clearTimeout(syncTimeout)
  }

  syncTimeout = setTimeout(async () => {
    const authState = useAuthStore.getState()
    if (!authState.user?.accessToken) return

    try {
      const allLocal = await getAllReadingProgress()
      const settings = useSettingsStore.getState()

      const syncState: SyncState = {
        lastSyncedAt: Date.now(),
        readingProgress: allLocal,
        userSettings: {
          theme: settings.theme,
          fontSize: settings.fontSize,
          fontFamily: settings.fontFamily,
          lineHeight: settings.lineHeight,
          margin: settings.margin,
          textAlign: settings.textAlign,
          layout: settings.layout,
        },
      }

      await saveSyncStateToDrive(authState.user.accessToken, syncState)
    } catch (err) {
      console.warn('Lỗi đồng bộ tự động lên Google Drive:', err)
    }
  }, 2500)
}

export async function pullSyncFromDrive(): Promise<{
  updatedBooksCount: number
  promptBook?: { bookId: string; progress: ReadingProgress }
}> {
  const authState = useAuthStore.getState()
  if (!authState.user?.accessToken) {
    return { updatedBooksCount: 0 }
  }

  try {
    const remoteState = await getSyncStateFromDrive(authState.user.accessToken)
    if (!remoteState || !remoteState.readingProgress) {
      return { updatedBooksCount: 0 }
    }

    let updatedBooksCount = 0
    let promptBook: { bookId: string; progress: ReadingProgress } | undefined

    for (const [bookId, remoteProg] of Object.entries(remoteState.readingProgress)) {
      const localProg = await getReadingProgress(bookId)
      // If remote has newer progress than local
      if (!localProg || remoteProg.updatedAt > localProg.updatedAt) {
        await saveReadingProgress(remoteProg)
        updatedBooksCount++

        // If it was read recently (e.g. in the last 24h), keep track for prompting
        if (
          !promptBook ||
          remoteProg.updatedAt > promptBook.progress.updatedAt
        ) {
          promptBook = { bookId, progress: remoteProg }
        }
      }
    }

    // Apply remote settings if newer
    if (remoteState.userSettings) {
      const settingsStore = useSettingsStore.getState()
      settingsStore.updateSettings(remoteState.userSettings)
    }

    return { updatedBooksCount, promptBook }
  } catch (err) {
    console.error('Lỗi khi tải đồng bộ từ Google Drive:', err)
    return { updatedBooksCount: 0 }
  }
}
