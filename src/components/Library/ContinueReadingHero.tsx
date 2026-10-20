import React from 'react'
import { useBookStore } from '../../store/useBookStore'
import { BookOpen, Play, Clock, Sparkles } from 'lucide-react'

export const ContinueReadingHero: React.FC = () => {
  const { books, progressMap, openBook } = useBookStore()

  // Find the most recently read book that is in progress
  const recentBook = React.useMemo(() => {
    const candidates = books
      .map((b) => ({
        book: b,
        progress: progressMap[b.id],
      }))
      .filter((item) => item.progress && item.progress.percentage > 0 && item.progress.percentage < 100)
      .sort((a, b) => (b.progress?.updatedAt || 0) - (a.progress?.updatedAt || 0))

    return candidates[0] || null
  }, [books, progressMap])

  if (!recentBook) return null

  const { book, progress } = recentBook

  const getRelativeTime = (timestamp?: number) => {
    if (!timestamp) return 'Gần đây'
    const diffMin = Math.round((Date.now() - timestamp) / (1000 * 60))
    if (diffMin < 1) return 'Vừa xong'
    if (diffMin < 60) return `${diffMin} phút trước`
    const diffHours = Math.round(diffMin / 60)
    if (diffHours < 24) return `${diffHours} giờ trước`
    return `${Math.round(diffHours / 24)} ngày trước`
  }

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl glass-panel border border-white/10 p-6 md:p-8 shadow-2xl">
      {/* Background ambient glow matching book format */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* 3D Book Cover Presentation */}
        <div
          onClick={() => openBook(book)}
          className="cursor-pointer group shrink-0 relative"
        >
          <div className="w-32 h-44 md:w-36 md:h-52 rounded-xl overflow-hidden book-spine-3d bg-gradient-to-tr from-blue-950 via-slate-900 to-indigo-900 border border-white/20 p-4 flex flex-col justify-between group-hover:-translate-y-2 group-hover:rotate-1 transition-all duration-300 shadow-2xl">
            <span className="self-end px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {book.format}
            </span>
            <div className="my-auto text-center">
              <BookOpen className="w-8 h-8 text-blue-400 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-white line-clamp-3 leading-snug">
                {book.title}
              </p>
            </div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hero Info */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>TIẾP TỤC ĐỌC DỞ</span>
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            {book.title}
          </h2>

          <p className="text-xs md:text-sm text-slate-400 flex items-center justify-center md:justify-start space-x-4">
            {book.author && <span>Tác giả: <strong className="text-slate-200">{book.author}</strong></span>}
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{getRelativeTime(progress.updatedAt)}</span>
            </span>
          </p>

          {/* Progress Bar & Stats */}
          <div className="max-w-md pt-1 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>Tiến độ: Trang {progress.page || 1}</span>
              <span className="text-blue-400 font-bold">{progress.percentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* CTA Action */}
          <div className="pt-2">
            <button
              onClick={() => openBook(book)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 flex items-center space-x-2 transition-all hover:scale-105 active:scale-95 mx-auto md:mx-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Đọc tiếp cuốn này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
