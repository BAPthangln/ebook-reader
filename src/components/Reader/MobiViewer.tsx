import React, { useEffect, useRef, useState, useMemo } from 'react'
import { parseMobiBuffer, type ParsedMobi } from '../../services/mobiParser'
import { useSettingsStore } from '../../store/useSettingsStore'
import { recordReadingProgress } from '../../services/syncService'
import type { Book, ReadingProgress } from '../../types'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface MobiViewerProps {
  book: Book
  data: ArrayBuffer
  initialLocation?: string
  onTocReady?: (toc: { label: string; href: string }[]) => void
  onProgressChange?: (percentage: number, location: string) => void
}

export const MobiViewer: React.FC<MobiViewerProps> = ({
  book,
  data,
  initialLocation,
  onTocReady,
  onProgressChange,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const settings = useSettingsStore()
  const [parsed, setParsed] = useState<ParsedMobi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Compute theme colors
  const themeColors = useMemo(() => {
    switch (settings.theme) {
      case 'light':
        return { bg: '#ffffff', text: '#1e293b' }
      case 'dark':
        return { bg: '#1e293b', text: '#e2e8f0' }
      case 'oled':
        return { bg: '#000000', text: '#d1d5db' }
      case 'custom':
        return { bg: settings.customBgColor, text: settings.customTextColor }
      case 'sepia':
      default:
        return { bg: '#fbf0d9', text: '#4a3728' }
    }
  }, [settings.theme, settings.customBgColor, settings.customTextColor])

  // Parse MOBI buffer on mount
  useEffect(() => {
    try {
      setIsLoading(true)
      const result = parseMobiBuffer(data, book.title)
      setParsed(result)

      if (onTocReady && result.chapters.length > 0) {
        onTocReady(
          result.chapters.map((ch, idx) => ({
            label: ch.title,
            href: `offset-${ch.offset || idx}`,
          }))
        )
      }
      setIsLoading(false)
    } catch (err) {
      console.error('Lỗi phân tích cú pháp sách MOBI:', err)
      setError('Không thể mở sách MOBI/AZW này. Định dạng có thể được bảo vệ DRM.')
      setIsLoading(false)
    }
  }, [data, book.title])

  // Restore scroll position
  useEffect(() => {
    if (!parsed || !scrollContainerRef.current) return
    if (initialLocation && initialLocation.startsWith('scroll-')) {
      const scrollY = parseInt(initialLocation.replace('scroll-', ''), 10)
      if (!isNaN(scrollY)) {
        setTimeout(() => {
          scrollContainerRef.current?.scrollTo({ top: scrollY, behavior: 'auto' })
        }, 100)
      }
    }
  }, [parsed, initialLocation])

  // Handle scroll events and save progress
  const handleScroll = () => {
    const el = scrollContainerRef.current
    if (!el) return

    const scrollTotal = el.scrollHeight - el.clientHeight
    if (scrollTotal <= 0) return

    const percentage = Math.min(100, Math.max(0, Math.round((el.scrollTop / scrollTotal) * 100)))
    const locationStr = `scroll-${Math.round(el.scrollTop)}`

    if (onProgressChange) {
      onProgressChange(percentage, locationStr)
    }

    const progressRecord: ReadingProgress = {
      bookId: book.id,
      bookTitle: book.title,
      format: book.format,
      location: locationStr,
      page: Math.round((percentage / 100) * 100) || 1,
      totalEstimatedPages: 100,
      percentage,
      updatedAt: Date.now(),
      device: 'Web PWA',
    }
    recordReadingProgress(progressRecord)
  }

  const handlePageDown = () => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollBy({ top: el.clientHeight * 0.85, behavior: 'smooth' })
  }

  const handlePageUp = () => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollBy({ top: -el.clientHeight * 0.85, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-300">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
        <p className="text-sm font-medium">Đang giải mã sách Kindle MOBI/AZW...</p>
      </div>
    )
  }

  if (error || !parsed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-300">
        <div className="max-w-md p-6 bg-slate-800 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-rose-400 mb-2">Lỗi giải mã file Kindle</h3>
          <p className="text-sm text-slate-300 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  const marginClass =
    settings.margin === 'narrow' ? 'max-w-4xl px-4' : settings.margin === 'wide' ? 'max-w-2xl px-8' : 'max-w-3xl px-6'

  return (
    <div
      className="relative w-full h-full flex flex-col select-text transition-colors duration-300"
      style={{ backgroundColor: themeColors.bg, color: themeColors.text }}
    >
      {/* Scrollable content container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 w-full h-full overflow-y-auto"
      >
        <div
          className={`mx-auto py-12 ${marginClass}`}
          style={{
            fontFamily: `"${settings.fontFamily}", system-ui, serif`,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            textAlign: settings.textAlign,
          }}
        >
          {/* Header */}
          <div className="mb-10 pb-6 border-b border-black/10 dark:border-white/10 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{parsed.title}</h1>
            {book.author && <p className="text-sm opacity-70 italic">{book.author}</p>}
          </div>

          {/* Body HTML */}
          <div
            className="prose max-w-none space-y-4"
            style={{ color: themeColors.text }}
            dangerouslySetInnerHTML={{ __html: parsed.contentHtml }}
          />
        </div>
      </div>

      {/* Floating page flip buttons */}
      <button
        onClick={handlePageUp}
        title="Cuộn lên"
        className="absolute left-4 bottom-6 p-2 rounded-full bg-slate-900/50 hover:bg-slate-900/80 text-white backdrop-blur shadow-lg transition-transform hover:scale-105"
      >
        <ChevronLeft className="w-5 h-5 rotate-90" />
      </button>

      <button
        onClick={handlePageDown}
        title="Cuộn xuống"
        className="absolute right-4 bottom-6 p-2 rounded-full bg-slate-900/50 hover:bg-slate-900/80 text-white backdrop-blur shadow-lg transition-transform hover:scale-105"
      >
        <ChevronRight className="w-5 h-5 rotate-90" />
      </button>
    </div>
  )
}
