import React from 'react'
import type { ReadingProgress } from '../types'
import { useBookStore } from '../store/useBookStore'
import { Sparkles, X, ArrowRight } from 'lucide-react'

interface SyncPromptBannerProps {
  prompt: {
    bookId: string
    progress: ReadingProgress
  } | null
  onDismiss: () => void
}

export const SyncPromptBanner: React.FC<SyncPromptBannerProps> = ({
  prompt,
  onDismiss,
}) => {
  const { books, openBook } = useBookStore()

  if (!prompt) return null

  const targetBook = books.find((b) => b.id === prompt.bookId)
  if (!targetBook) return null

  const handleContinueReading = () => {
    openBook(targetBook)
    onDismiss()
  }

  return (
    <div className="fixed bottom-6 right-6 left-6 sm:left-auto sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="p-4 rounded-2xl bg-slate-800/95 border border-blue-500/40 shadow-2xl backdrop-blur-md text-slate-100 flex items-start space-x-3.5">
        <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>

        <div className="flex-1 overflow-hidden pr-2">
          <div className="flex items-center space-x-1.5 mb-1">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
              Đồng bộ đa thiết bị
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-2">
            Bạn vừa đọc cuốn <strong className="text-white font-medium">"{targetBook.title}"</strong>{' '}
            tới <span className="text-blue-400 font-semibold">{prompt.progress.percentage}%</span>{' '}
            trên thiết bị khác.
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleContinueReading}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 transition-all shadow-md shadow-blue-600/20"
            >
              <span>Đọc tiếp trang {prompt.progress.page || ''}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDismiss}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              Để sau
            </button>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
