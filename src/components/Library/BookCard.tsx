import React from 'react'
import type { Book, ReadingProgress } from '../../types'
import { useBookStore } from '../../store/useBookStore'
import {
  BookOpen,
  CloudCheck,
  CloudDownload,
  Trash2,
  FileText,
  Sparkles,
} from 'lucide-react'

interface BookCardProps {
  book: Book
  progress?: ReadingProgress
}

export const BookCard: React.FC<BookCardProps> = ({ book, progress }) => {
  const { openBook, removeBook, downloadForOffline, isDownloading } = useBookStore()

  const percentage = progress?.percentage || 0

  const getFormatBadgeColor = () => {
    switch (book.format) {
      case 'epub':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      case 'pdf':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      case 'mobi':
      case 'azw':
      case 'azw2':
      case 'azw3':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      case 'cbz':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
    }
  }

  const getFormatCoverGradient = () => {
    switch (book.format) {
      case 'epub':
        return 'from-emerald-950 via-slate-900 to-teal-950'
      case 'pdf':
        return 'from-rose-950 via-slate-900 to-red-950'
      case 'mobi':
      case 'azw':
      case 'azw2':
      case 'azw3':
        return 'from-amber-950 via-slate-900 to-yellow-950'
      default:
        return 'from-blue-950 via-slate-900 to-indigo-950'
    }
  }

  return (
    <div className="group relative flex flex-col transition-all duration-300">
      {/* 3D Book Cover Card */}
      <div
        onClick={() => openBook(book)}
        className={`relative aspect-[3/4.2] rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br ${getFormatCoverGradient()} border border-white/10 p-3.5 flex flex-col justify-between book-spine-3d group-hover:-translate-y-2 group-hover:rotate-0.5 transition-all duration-300 shadow-xl group-hover:shadow-2xl group-hover:shadow-blue-500/10`}
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between w-full z-10">
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border backdrop-blur-md ${getFormatBadgeColor()}`}
          >
            {book.format}
          </span>

          {book.isOffline ? (
            <span
              className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
              title="Đã lưu offline trong máy"
            >
              <CloudCheck className="w-3.5 h-3.5" />
            </span>
          ) : (
            book.driveFileId && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  downloadForOffline(book)
                }}
                disabled={isDownloading}
                title="Tải về máy để đọc không cần mạng"
                className="p-1 rounded-full bg-black/40 hover:bg-blue-600 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
              >
                <CloudDownload className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>

        {/* Center Artwork / Title */}
        <div className="my-auto flex flex-col items-center justify-center text-center px-1">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover rounded-lg shadow"
            />
          ) : (
            <>
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2.5 group-hover:scale-110 group-hover:bg-white/10 transition-all shadow-inner">
                {book.format === 'pdf' ? (
                  <FileText className="w-5 h-5 text-rose-400" />
                ) : (
                  <BookOpen className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <p className="text-xs font-bold text-white line-clamp-3 leading-snug drop-shadow-sm">
                {book.title}
              </p>
            </>
          )}
        </div>

        {/* Bottom Progress Bar */}
        <div className="w-full pt-1.5 z-10">
          {percentage > 0 ? (
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-medium mb-1">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>Đã đọc</span>
                </span>
                <span className="font-bold text-blue-400">{percentage}%</span>
              </div>
              <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-[10px] text-slate-400/80 italic">Chưa đọc</span>
            </div>
          )}
        </div>
      </div>

      {/* Book Metadata Below Cover */}
      <div className="mt-3 px-1 flex items-start justify-between">
        <div className="overflow-hidden flex-1 pr-2">
          <h4
            onClick={() => openBook(book)}
            className="text-xs font-semibold text-slate-200 truncate cursor-pointer hover:text-blue-400 transition-colors"
            title={book.title}
          >
            {book.title}
          </h4>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {book.author || (book.isOffline ? 'Bộ nhớ máy' : 'Google Drive')}
          </p>
        </div>

        {/* Delete Quick Action */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (window.confirm(`Bạn có chắc muốn xóa "${book.title}" khỏi thư viện?`)) {
              removeBook(book.id)
            }
          }}
          title="Xóa khỏi thư viện"
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
