import { create } from 'zustand'
import type { Book, BookFormat, ReadingProgress } from '../types'
import {
  db,
  saveBookToDb,
  getBookBlob,
  removeBookFromDb,
  getAllReadingProgress,
} from '../db'
import { downloadDriveFile } from '../services/googleDrive'
import { useAuthStore } from './useAuthStore'

interface BookStore {
  books: Book[]
  progressMap: Record<string, ReadingProgress>
  filterFormat: 'all' | BookFormat
  filterStatus: 'all' | 'reading' | 'completed' | 'offline'
  searchQuery: string
  sortBy: 'lastRead' | 'title' | 'createdAt'

  activeBook: Book | null
  activeBookData: ArrayBuffer | null
  activeMimeType: string | null

  isLoading: boolean
  isDownloading: boolean
  error: string | null

  loadBooks: () => Promise<void>
  openBook: (book: Book) => Promise<void>
  closeBook: () => void
  addBook: (book: Book, data?: ArrayBuffer, mimeType?: string) => Promise<void>
  removeBook: (bookId: string) => Promise<void>
  downloadForOffline: (book: Book) => Promise<void>
  importLocalFile: (file: File) => Promise<void>

  setFilterFormat: (format: 'all' | BookFormat) => void
  setFilterStatus: (status: 'all' | 'reading' | 'completed' | 'offline') => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: 'lastRead' | 'title' | 'createdAt') => void
  clearError: () => void
}

export function detectFormatFromFilename(name: string): BookFormat {
  const lower = name.toLowerCase()
  if (lower.endsWith('.epub')) return 'epub'
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.mobi')) return 'mobi'
  if (lower.endsWith('.azw3')) return 'azw3'
  if (lower.endsWith('.azw2')) return 'azw2'
  if (lower.endsWith('.azw')) return 'azw'
  if (lower.endsWith('.cbz') || lower.endsWith('.cbr')) return 'cbz'
  return 'txt'
}

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  progressMap: {},
  filterFormat: 'all',
  filterStatus: 'all',
  searchQuery: '',
  sortBy: 'lastRead',

  activeBook: null,
  activeBookData: null,
  activeMimeType: null,

  isLoading: false,
  isDownloading: false,
  error: null,

  loadBooks: async () => {
    set({ isLoading: true })
    try {
      const allBooks = await db.books.toArray()
      const progressMap = await getAllReadingProgress()
      set({ books: allBooks, progressMap, isLoading: false })
    } catch (err) {
      console.error('Lỗi khi tải thư viện sách:', err)
      set({ isLoading: false, error: 'Không thể đọc thư viện từ bộ nhớ máy' })
    }
  },

  openBook: async (book: Book) => {
    set({ isLoading: true, error: null })
    try {
      // 1. Check if blob already exists in local DB
      const localRecord = await getBookBlob(book.id)
      if (localRecord && localRecord.data) {
        set({
          activeBook: book,
          activeBookData: localRecord.data,
          activeMimeType: localRecord.mimeType,
          isLoading: false,
        })
        return
      }

      // 2. If not local and has driveFileId, stream from Google Drive
      if (book.driveFileId) {
        const auth = useAuthStore.getState()
        if (!auth.user?.accessToken) {
          throw new Error('Cần đăng nhập Google để tải sách này từ Google Drive.')
        }

        const { buffer, mimeType } = await downloadDriveFile(
          auth.user.accessToken,
          book.driveFileId
        )

        // Cache in IndexedDB if marked as offline
        if (book.isOffline) {
          await saveBookToDb(book, buffer, mimeType)
        }

        set({
          activeBook: book,
          activeBookData: buffer,
          activeMimeType: mimeType,
          isLoading: false,
        })
        return
      }

      throw new Error('Không tìm thấy dữ liệu tệp của cuốn sách này.')
    } catch (err) {
      console.error('Lỗi khi mở sách:', err)
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Không thể mở sách.',
      })
    }
  },

  closeBook: () => {
    set({ activeBook: null, activeBookData: null, activeMimeType: null })
    // Refresh library progress
    get().loadBooks()
  },

  addBook: async (book: Book, data?: ArrayBuffer, mimeType?: string) => {
    await saveBookToDb(book, data, mimeType)
    await get().loadBooks()
  },

  removeBook: async (bookId: string) => {
    await removeBookFromDb(bookId)
    await get().loadBooks()
  },

  downloadForOffline: async (book: Book) => {
    if (!book.driveFileId) return
    const auth = useAuthStore.getState()
    if (!auth.user?.accessToken) {
      set({ error: 'Cần đăng nhập Google để tải sách về đọc offline.' })
      return
    }

    set({ isDownloading: true })
    try {
      const { buffer, mimeType } = await downloadDriveFile(
        auth.user.accessToken,
        book.driveFileId
      )

      const updatedBook: Book = { ...book, isOffline: true }
      await saveBookToDb(updatedBook, buffer, mimeType)
      await get().loadBooks()
      set({ isDownloading: false })
    } catch (err) {
      console.error('Lỗi tải sách offline:', err)
      set({
        isDownloading: false,
        error: 'Tải sách về máy thất bại. Vui lòng thử lại.',
      })
    }
  },

  importLocalFile: async (file: File) => {
    set({ isLoading: true })
    try {
      const buffer = await file.arrayBuffer()
      const format = detectFormatFromFilename(file.name)
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '')

      const newBook: Book = {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: cleanTitle,
        format,
        size: file.size,
        isOffline: true,
        createdAt: Date.now(),
        lastReadAt: Date.now(),
      }

      await saveBookToDb(newBook, buffer, file.type || 'application/octet-stream')
      await get().loadBooks()
      set({ isLoading: false })
    } catch (err) {
      console.error('Lỗi nhập file cục bộ:', err)
      set({ isLoading: false, error: 'Không thể nhập file từ máy tính.' })
    }
  },

  setFilterFormat: (format) => set({ filterFormat: format }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sort) => set({ sortBy: sort }),
  clearError: () => set({ error: null }),
}))
