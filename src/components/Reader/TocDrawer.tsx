import React, { useState } from 'react'
import { X, Search, Bookmark, BookOpen } from 'lucide-react'

interface TocItem {
  label: string
  href: string
}

interface TocDrawerProps {
  isOpen: boolean
  onClose: () => void
  toc: TocItem[]
  onSelectChapter: (href: string) => void
  bookTitle?: string
}

export const TocDrawer: React.FC<TocDrawerProps> = ({
  isOpen,
  onClose,
  toc,
  onSelectChapter,
  bookTitle,
}) => {
  const [filter, setFilter] = useState('')

  if (!isOpen) return null

  const filteredToc = toc.filter((item) =>
    item.label.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-80 md:w-96 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col z-10 text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate pr-2">
            <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
            <h3 className="font-semibold text-sm truncate">{bookTitle || 'Mục lục sách'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm chương..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredToc.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              {toc.length === 0 ? 'Sách này không có mục lục.' : 'Không tìm thấy chương phù hợp.'}
            </div>
          ) : (
            filteredToc.map((chapter, index) => (
              <button
                key={`${chapter.href}_${index}`}
                onClick={() => {
                  onSelectChapter(chapter.href)
                  onClose()
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center space-x-2 transition-colors group"
              >
                <Bookmark className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0" />
                <span className="truncate">{chapter.label || `Chương ${index + 1}`}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
