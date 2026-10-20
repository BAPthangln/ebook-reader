export type BookFormat = 'epub' | 'pdf' | 'mobi' | 'azw' | 'azw2' | 'azw3' | 'cbz' | 'txt'

export interface Book {
  id: string // Unique identifier (Google Drive fileId or local uuid)
  title: string
  author?: string
  format: BookFormat
  coverUrl?: string
  size?: number
  driveFileId?: string
  isOffline: boolean
  createdAt: number
  lastReadAt: number
}

export interface ReadingProgress {
  bookId: string
  bookTitle?: string
  format: BookFormat
  location: string // CFI for epub, page-N for pdf, offset for mobi/txt
  page: number
  totalEstimatedPages?: number
  percentage: number
  updatedAt: number
  device?: string
}

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'oled' | 'custom'

export interface ReaderSettings {
  theme: ReaderTheme
  customBgColor: string
  customTextColor: string
  fontFamily: string
  fontSize: number // in px (12 to 36)
  lineHeight: number // 1.2 to 2.2
  margin: 'narrow' | 'normal' | 'wide'
  textAlign: 'justify' | 'left'
  layout: 'paginated' | 'scrolled'
  columnCount: 'auto' | '1' | '2'
}

export interface Bookmark {
  id?: number
  bookId: string
  location: string
  title: string
  createdAt: number
}

export interface Highlight {
  id?: number
  bookId: string
  text: string
  location: string
  color: string
  note?: string
  createdAt: number
}

export interface GoogleUser {
  email: string
  name: string
  picture: string
  accessToken: string
  expiresAt: number
}

export interface SyncState {
  lastSyncedAt: number
  readingProgress: Record<string, ReadingProgress>
  userSettings?: Partial<ReaderSettings>
}

export interface DriveFileItem {
  id: string
  name: string
  mimeType: string
  size?: string
  thumbnailLink?: string
  modifiedTime?: string
  iconLink?: string
}
