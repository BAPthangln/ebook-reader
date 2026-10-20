import React, { useEffect, useRef, useState, useCallback } from 'react'
import ePub, { type Book as EpubBook, type Rendition } from 'epubjs'
import { useSettingsStore } from '../../store/useSettingsStore'
import { recordReadingProgress } from '../../services/syncService'
import type { Book, ReadingProgress } from '../../types'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface EpubViewerProps {
  book: Book
  data: ArrayBuffer
  initialLocation?: string
  onLocationsReady?: (total: number) => void
  onTocReady?: (toc: { label: string; href: string }[]) => void
  onProgressChange?: (percentage: number, location: string) => void
}

export const EpubViewer: React.FC<EpubViewerProps> = ({
  book,
  data,
  initialLocation,
  onLocationsReady,
  onTocReady,
  onProgressChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const epubBookRef = useRef<EpubBook | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  const settings = useSettingsStore()

  const [isLoading, setIsLoading] = useState(true)

  // Compute active colors from settings
  const getThemeColors = useCallback(() => {
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

  // Apply theme styles to epub rendition
  const applyStyles = useCallback(() => {
    if (!renditionRef.current) return
    const colors = getThemeColors()
    const marginPx =
      settings.margin === 'narrow' ? '12px' : settings.margin === 'wide' ? '40px' : '24px'

    renditionRef.current.themes.register('activeTheme', {
      body: {
        'background-color': `${colors.bg} !important`,
        color: `${colors.text} !important`,
        'font-family': `"${settings.fontFamily}", system-ui, serif !important`,
        'font-size': `${settings.fontSize}px !important`,
        'line-height': `${settings.lineHeight} !important`,
        'text-align': `${settings.textAlign} !important`,
        padding: `0 ${marginPx} !important`,
      },
      'p, span, div, a, li, h1, h2, h3, h4, h5, h6': {
        color: `${colors.text} !important`,
        'font-family': `"${settings.fontFamily}", system-ui, serif !important`,
      },
      a: {
        'text-decoration': 'underline !important',
      },
    })
    renditionRef.current.themes.select('activeTheme')
  }, [getThemeColors, settings])

  // Initialize Epub.js
  useEffect(() => {
    if (!containerRef.current) return
    setIsLoading(true)

    // @ts-expect-error epubjs export compatibility
    const epubCreator = ePub.default || ePub
    const bookInstance = epubCreator(data) as EpubBook
    epubBookRef.current = bookInstance

    const rendition = bookInstance.renderTo(containerRef.current, {
      width: '100%',
      height: '100%',
      flow: settings.layout === 'scrolled' ? 'scrolled' : 'paginated',
      spread: 'auto',
      allowScriptedContent: true,
    })
    renditionRef.current = rendition

    // Load Table of Contents
    bookInstance.loaded.navigation.then((nav) => {
      if (onTocReady && nav.toc) {
        onTocReady(
          nav.toc.map((t) => ({
            label: t.label.trim(),
            href: t.href,
          }))
        )
      }
    })

    // Display initial position or start
    rendition
      .display(initialLocation || undefined)
      .then(() => {
        setIsLoading(false)
        applyStyles()
      })
      .catch((err) => {
        console.warn('Không thể khôi phục vị trí cũ, chuyển về đầu sách:', err)
        rendition.display().then(() => {
          setIsLoading(false)
          applyStyles()
        })
      })

    // Listen to page changes (relocated)
    rendition.on('relocated', (location: { start: { cfi: string; displayed: { page: number; total: number } } }) => {
      const cfi = location.start.cfi

      let percentage = 0
      if (bookInstance.locations.length()) {
        percentage = Math.round(bookInstance.locations.percentageFromCfi(cfi) * 100)
      }

      if (onProgressChange) {
        onProgressChange(percentage, cfi)
      }

      // Record to IndexedDB & Debounced Google Drive
      const progressRecord: ReadingProgress = {
        bookId: book.id,
        bookTitle: book.title,
        format: 'epub',
        location: cfi,
        page: location.start.displayed?.page || 1,
        totalEstimatedPages: location.start.displayed?.total || 100,
        percentage,
        updatedAt: Date.now(),
        device: 'Web PWA',
      }
      recordReadingProgress(progressRecord)
    })

    // Generate locations in background for accurate percentages
    bookInstance.ready.then(() => {
      return bookInstance.locations.generate(1024)
    }).then(() => {
      if (onLocationsReady) {
        onLocationsReady(bookInstance.locations.length())
      }
    })

    // Clean up
    return () => {
      rendition.destroy()
      bookInstance.destroy()
    }
  }, [data, book.id])

  // Re-apply styles when settings change
  useEffect(() => {
    applyStyles()
  }, [applyStyles])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!renditionRef.current) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        renditionRef.current.next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        renditionRef.current.prev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handlePrev = () => {
    renditionRef.current?.prev()
  }

  const handleNext = () => {
    renditionRef.current?.next()
  }

  const colors = getThemeColors()

  return (
    <div
      className="relative w-full h-full flex flex-col select-none transition-colors duration-300"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 z-20 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
          <p className="text-sm text-slate-300 font-medium">Đang tải nội dung sách...</p>
        </div>
      )}

      {/* Reader render surface */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        <div ref={containerRef} className="w-full h-full" />

        {/* Floating Prev/Next Click Areas */}
        <button
          onClick={handlePrev}
          title="Trang trước (Phím mũi tên trái)"
          className="absolute left-0 top-0 bottom-0 w-16 md:w-24 opacity-0 hover:opacity-100 flex items-center justify-start pl-4 transition-opacity group cursor-pointer"
        >
          <div className="p-2 rounded-full bg-slate-900/40 text-white backdrop-blur-md shadow-lg group-hover:scale-110 transition-transform">
            <ChevronLeft className="w-6 h-6" />
          </div>
        </button>

        <button
          onClick={handleNext}
          title="Trang sau (Phím mũi tên phải)"
          className="absolute right-0 top-0 bottom-0 w-16 md:w-24 opacity-0 hover:opacity-100 flex items-center justify-end pr-4 transition-opacity group cursor-pointer"
        >
          <div className="p-2 rounded-full bg-slate-900/40 text-white backdrop-blur-md shadow-lg group-hover:scale-110 transition-transform">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>
      </div>
    </div>
  )
}
