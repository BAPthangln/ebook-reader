import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { recordReadingProgress } from '../../services/syncService'
import type { Book, ReadingProgress } from '../../types'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
} from 'lucide-react'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

interface PdfViewerProps {
  book: Book
  data: ArrayBuffer
  initialLocation?: string
  onProgressChange?: (percentage: number, location: string) => void
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  book,
  data,
  initialLocation,
  onProgressChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [numPages, setNumPages] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.2)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [pageInput, setPageInput] = useState<string>('1')

  // Parse initial page from location (e.g., "page-12" or "12")
  useEffect(() => {
    if (initialLocation) {
      const match = initialLocation.match(/\d+/)
      if (match) {
        const page = parseInt(match[0], 10)
        if (page > 0) {
          setCurrentPage(page)
          setPageInput(String(page))
        }
      }
    }
  }, [initialLocation])

  // Load PDF document from ArrayBuffer
  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(data),
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
    })

    loadingTask.promise
      .then((doc) => {
        if (!isCancelled) {
          setPdfDoc(doc)
          setNumPages(doc.numPages)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Lỗi tải tài liệu PDF:', err)
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
      loadingTask.destroy()
    }
  }, [data])

  // Render current page onto Canvas
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc || !canvasRef.current) return

      try {
        const page = await pdfDoc.getPage(pageNumber)
        const viewport = page.getViewport({ scale })
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        await page.render(renderContext).promise

        // Calculate progress percentage
        const percentage = Math.round((pageNumber / numPages) * 100)
        const locationStr = `page-${pageNumber}`

        if (onProgressChange) {
          onProgressChange(percentage, locationStr)
        }

        // Save progress to IndexedDB and debounced Google Drive
        const progressRecord: ReadingProgress = {
          bookId: book.id,
          bookTitle: book.title,
          format: 'pdf',
          location: locationStr,
          page: pageNumber,
          totalEstimatedPages: numPages,
          percentage,
          updatedAt: Date.now(),
          device: 'Web PWA',
        }
        recordReadingProgress(progressRecord)
      } catch (err) {
        console.error('Lỗi khi vẽ trang PDF:', err)
      }
    },
    [pdfDoc, scale, numPages, book, onProgressChange]
  )

  useEffect(() => {
    if (pdfDoc && currentPage >= 1 && currentPage <= numPages) {
      renderPage(currentPage)
      setPageInput(String(currentPage))
    }
  }, [pdfDoc, currentPage, scale, renderPage, numPages])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        setCurrentPage((prev) => Math.min(prev + 1, numPages))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((prev) => Math.max(prev - 1, 1))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [numPages])

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages))
  }

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = parseInt(pageInput, 10)
    if (!isNaN(p) && p >= 1 && p <= numPages) {
      setCurrentPage(p)
    } else {
      setPageInput(String(currentPage))
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900 select-none overflow-hidden">
      {/* PDF Controls Topbar */}
      <div className="h-12 bg-slate-800/80 backdrop-blur border-b border-slate-700/60 px-4 flex items-center justify-between z-10">
        {/* Pagination controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrev}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageSubmit} className="flex items-center text-xs text-slate-300">
            <span>Trang</span>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageSubmit}
              className="w-12 mx-1.5 px-1.5 py-0.5 text-center bg-slate-900 border border-slate-600 rounded text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <span>/ {numPages}</span>
          </form>

          <button
            onClick={handleNext}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
            className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-300 min-w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
            className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(1.2)}
            className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Vừa trang"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Canvas scroll area */}
      <div className="flex-1 w-full overflow-auto flex justify-center items-start p-4 bg-slate-950/80">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center my-auto">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-xs text-slate-400">Đang tải trang PDF...</p>
          </div>
        ) : (
          <div className="shadow-2xl rounded-sm overflow-hidden bg-white">
            <canvas ref={canvasRef} className="block max-w-none" />
          </div>
        )}
      </div>
    </div>
  )
}
