import React from 'react'
import { useBookStore } from '../../store/useBookStore'
import type { BookFormat } from '../../types'
import { Search, SlidersHorizontal } from 'lucide-react'

export const LibraryFilters: React.FC = () => {
  const {
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
    { id: 'all', label: 'Tất cả' },
    { id: 'epub', label: 'EPUB' },
    { id: 'pdf', label: 'PDF' },
    { id: 'mobi', label: 'Kindle (MOBI/AZW)' },
  ]

  const statuses: { id: 'all' | 'reading' | 'completed' | 'offline'; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'reading', label: 'Đang đọc' },
    { id: 'offline', label: 'Đã tải offline' },
  ]

  return (
    <div className="space-y-4 mb-6">
      {/* Top Search & Sort Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm sách theo tên, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Sort Select */}
        <div className="flex items-center space-x-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'lastRead' | 'title' | 'createdAt')
            }
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="lastRead">Đọc gần đây nhất</option>
            <option value="title">Tên sách (A-Z)</option>
            <option value="createdAt">Mới thêm vào</option>
          </select>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        {/* Formats */}
        <div className="flex flex-wrap items-center gap-1.5">
          {formats.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setFilterFormat(fmt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterFormat === fmt.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center space-x-1.5">
          {statuses.map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === st.id
                  ? 'bg-slate-700 text-blue-400 border border-blue-500/30'
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
