import Dexie, { type Table } from 'dexie'
import type { Book, ReadingProgress, Bookmark, Highlight } from '../types'

export interface BookBlobRecord {
  bookId: string
  data: ArrayBuffer
  mimeType: string
  updatedAt: number
}

export class EbookDatabase extends Dexie {
  books!: Table<Book, string>
  bookBlobs!: Table<BookBlobRecord, string>
  progress!: Table<ReadingProgress, string>
  bookmarks!: Table<Bookmark, number>
  highlights!: Table<Highlight, number>

  constructor() {
    super('EbookReaderDB')
    this.version(1).stores({
      books: '&id, title, author, format, isOffline, lastReadAt, createdAt',
      bookBlobs: '&bookId, updatedAt',
      progress: '&bookId, percentage, updatedAt',
      bookmarks: '++id, bookId, createdAt',
      highlights: '++id, bookId, createdAt',
    })
  }
}

export const db = new EbookDatabase()

// Database Helper methods
export async function saveBookToDb(book: Book, data?: ArrayBuffer, mimeType?: string): Promise<void> {
  await db.transaction('rw', db.books, db.bookBlobs, async () => {
    await db.books.put(book)
    if (data && mimeType) {
      await db.bookBlobs.put({
        bookId: book.id,
        data,
        mimeType,
        updatedAt: Date.now(),
      })
    }
  })
}

export async function getBookBlob(bookId: string): Promise<BookBlobRecord | undefined> {
  return db.bookBlobs.get(bookId)
}

export async function removeBookFromDb(bookId: string): Promise<void> {
  await db.transaction('rw', db.books, db.bookBlobs, db.progress, db.bookmarks, db.highlights, async () => {
    await db.books.delete(bookId)
    await db.bookBlobs.delete(bookId)
    await db.progress.delete(bookId)
    await db.bookmarks.where('bookId').equals(bookId).delete()
    await db.highlights.where('bookId').equals(bookId).delete()
  })
}

export async function saveReadingProgress(progress: ReadingProgress): Promise<void> {
  await db.transaction('rw', db.progress, db.books, async () => {
    await db.progress.put(progress)
    await db.books.update(progress.bookId, {
      lastReadAt: progress.updatedAt,
    })
  })
}

export async function getReadingProgress(bookId: string): Promise<ReadingProgress | undefined> {
  return db.progress.get(bookId)
}

export async function getAllReadingProgress(): Promise<Record<string, ReadingProgress>> {
  const all = await db.progress.toArray()
  const map: Record<string, ReadingProgress> = {}
  for (const item of all) {
    map[item.bookId] = item
  }
  return map
}
