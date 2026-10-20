import React from 'react'
import { useBookStore } from '../../store/useBookStore'
import type { BookFormat } from '../../types'
import { Search, SlidersHorizontal, Layers } from 'lucide-react'

export const LibraryFilters: React.FC = () => {
  const {
    books,
    filterFormat,
    filterStatus,
    searchQuery,
    sortBy,
    setFilterFormat,
    setFilterStatus,
    setSearchQuery,
    setSortBy,
  } = useBookStore()

  const formats: { id: 'all' | BookFormat; label: string }[] = [
    { id: 'all', label: 'Tất cả sách' },
    { id: 'epub', label: 'EPUB' },
    { id: 'pdf', label: 'PDF' },
    { id: 'mobi', label: 'Kindle (MOBI/AZW)' },
  ]

  const statuses: { id: 'all' | 'reading' | 'completed' | 'offline'; label: string }[] = [
    { id: 'all', label: 'Tất cả trạng thái' },
    { id: 'reading', label: 'Đang đọc' },
    { id: 'offline', label: 'Đã tải offline' },
  ]

  return (
    <div className="space-y-4 mb-8">
      {/* Search & Sort Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input with ambient glow */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề sách, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-900/60 hover:bg-slate-900/80 focus:bg-slate-900 border border-white/10 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
          />
        </div>

        {/* Sort & Book Counter */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 px-3 py-2 rounded-xl border border-white/5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>
              <strong className="text-white font-semibold">{books.length}</strong> cuốn trong thư viện
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/60 border border-white/10 rounded-xl px-2.5 py-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'lastRead' | 'title' | 'createdAt')
              }
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="lastRead" className="bg-slate-900">Đọc gần đây nhất</option>
              <option value="title" className="bg-slate-900">Tên sách (A-Z)</option>
              <option value="createdAt" className="bg-slate-900">Mới thêm vào</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/5 pb-4">
        {/* Formats Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {formats.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setFilterFormat(fmt.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterFormat === fmt.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-102'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-white/5'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-1.5">
          {statuses.map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterStatus === st.id
                  ? 'bg-white/10 text-blue-400 font-semibold border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
