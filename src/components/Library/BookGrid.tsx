import React, { useMemo } from 'react'
import { useBookStore } from '../../store/useBookStore'
import { BookCard } from './BookCard'
import { EmptyState } from './EmptyState'
import type { Book } from '../../types'

interface BookGridProps {
  onOpenDriveModal: () => void
}

export const BookGrid: React.FC<BookGridProps> = ({ onOpenDriveModal }) => {
  const {
    books,
    progressMap,
    filterFormat,
    filterStatus,
    searchQuery,
    sortBy,
  } = useBookStore()

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book: Book) => {
        // 1. Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchTitle = book.title.toLowerCase().includes(q)
          const matchAuthor = book.author?.toLowerCase().includes(q) || false
          if (!matchTitle && !matchAuthor) return false
        }

        // 2. Format Filter
        if (filterFormat !== 'all') {
          if (filterFormat === 'mobi') {
            if (
              book.format !== 'mobi' &&
              book.format !== 'azw' &&
              book.format !== 'azw2' &&
              book.format !== 'azw3'
            ) {
              return false
            }
          } else if (book.format !== filterFormat) {
            return false
          }
        }

        // 3. Status Filter
        const prog = progressMap[book.id]
        if (filterStatus === 'reading') {
          if (!prog || prog.percentage <= 0 || prog.percentage >= 100) return false
        } else if (filterStatus === 'completed') {
          if (!prog || prog.percentage < 100) return false
        } else if (filterStatus === 'offline') {
          if (!book.isOffline) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title)
        }
        if (sortBy === 'createdAt') {
          return b.createdAt - a.createdAt
        }
        // default: lastRead
        return b.lastReadAt - a.lastReadAt
      })
  }, [books, progressMap, filterFormat, filterStatus, searchQuery, sortBy])

  if (books.length === 0) {
    return <EmptyState onOpenDriveModal={onOpenDriveModal} />
  }

  if (filteredBooks.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
        <p className="text-sm text-slate-400">
          Không tìm thấy cuốn sách nào khớp với bộ lọc hiện tại.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {filteredBooks.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          progress={progressMap[book.id]}
        />
      ))}
    </div>
  )
}
