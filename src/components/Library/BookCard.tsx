import React from 'react'
import type { Book, ReadingProgress } from '../../types'
import { useBookStore } from '../../store/useBookStore'
import {
  BookOpen,
  CloudCheck,
  CloudDownload,
  Trash2,
  FileText,
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
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'pdf':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      case 'mobi':
      case 'azw':
      case 'azw2':
      case 'azw3':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'cbz':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  }

  const getFormatCoverGradient = () => {
    switch (book.format) {
      case 'epub':
        return 'from-emerald-900/60 to-slate-900'
      case 'pdf':
        return 'from-rose-950/60 to-slate-900'
      case 'mobi':
      case 'azw':
      case 'azw2':
      case 'azw3':
        return 'from-amber-950/60 to-slate-900'
      default:
        return 'from-blue-950/60 to-slate-900'
    }
  }

  return (
    <div className="group relative bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 rounded-2xl p-3 flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/10 hover:-translate-y-1">
      {/* Book Cover Container */}
      <div
        onClick={() => openBook(book)}
        className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer bg-gradient-to-br ${getFormatCoverGradient()} border border-slate-700/40 p-4 flex flex-col justify-between shadow-inner`}
      >
        {/* Top badges */}
        <div className="flex items-center justify-between w-full z-10">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${getFormatBadgeColor()}`}
          >
            {book.format}
          </span>

          {book.isOffline ? (
            <span
              className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              title="Đã tải về máy - Đọc không cần mạng"
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
                title="Tải về máy để đọc offline"
                className="p-1 rounded-full bg-slate-900/70 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-600/40 transition-colors"
              >
                <CloudDownload className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>

        {/* Center Book Art Icon */}
        <div className="my-auto flex flex-col items-center justify-center text-center px-2">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                {book.format === 'pdf' ? (
                  <FileText className="w-6 h-6 text-rose-400" />
                ) : (
                  <BookOpen className="w-6 h-6 text-blue-400" />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-200 line-clamp-3 leading-tight">
                {book.title}
              </p>
            </>
          )}
        </div>

        {/* Bottom spine effect */}
        <div className="w-full pt-2">
          {percentage > 0 && (
            <div className="w-full">
              <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                <span>Tiến độ</span>
                <span className="font-bold text-blue-400">{percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Book Metadata Bottom */}
      <div className="mt-3 px-1 flex items-start justify-between">
        <div className="overflow-hidden flex-1 pr-2">
          <h4
            onClick={() => openBook(book)}
            className="text-sm font-semibold text-slate-100 truncate cursor-pointer hover:text-blue-400 transition-colors"
            title={book.title}
          >
            {book.title}
          </h4>
          <p className="text-xs text-slate-400 truncate">
            {book.author || (book.isOffline ? 'Bộ nhớ máy' : 'Google Drive')}
          </p>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (window.confirm(`Bạn có chắc muốn xóa "${book.title}" khỏi thư viện?`)) {
              removeBook(book.id)
            }
          }}
          title="Xóa khỏi thư viện"
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
