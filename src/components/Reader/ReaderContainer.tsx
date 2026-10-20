import React, { useState, useEffect } from 'react'
import { useBookStore } from '../../store/useBookStore'
import { EpubViewer } from './EpubViewer'
import { PdfViewer } from './PdfViewer'
import { MobiViewer } from './MobiViewer'
import { ReaderSettingsModal } from './ReaderSettingsModal'
import { TocDrawer } from './TocDrawer'
import {
  ArrowLeft,
  Settings2,
  List,
  Maximize2,
  Minimize2,
  BookOpen,
} from 'lucide-react'

export const ReaderContainer: React.FC = () => {
  const { activeBook, activeBookData, closeBook, progressMap } = useBookStore()

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTocOpen, setIsTocOpen] = useState(false)
  const [toc, setToc] = useState<{ label: string; href: string }[]>([])
  const [progressPercentage, setProgressPercentage] = useState<number>(0)

  const initialProg = activeBook ? progressMap[activeBook.id] : undefined
  const initialLocation = initialProg?.location

  useEffect(() => {
    if (initialProg) {
      setProgressPercentage(initialProg.percentage || 0)
    }
  }, [initialProg])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  if (!activeBook || !activeBookData) return null

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* Reader Navigation Header */}
      <header className="h-14 px-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30 transition-all">
        {/* Left: Back & Title */}
        <div className="flex items-center space-x-3 overflow-hidden">
          <button
            onClick={closeBook}
            title="Quay lại Thư viện"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">Thư viện</span>
          </button>

          <div className="overflow-hidden">
            <h2 className="text-sm font-semibold truncate text-slate-100 max-w-xs md:max-w-md">
              {activeBook.title}
            </h2>
            {activeBook.author && (
              <p className="text-[11px] text-slate-400 truncate -mt-0.5">{activeBook.author}</p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1.5">
          {/* TOC Toggle */}
          <button
            onClick={() => setIsTocOpen(true)}
            title="Mục lục chương"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Reader Settings Toggle */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Cài đặt giao diện & font chữ"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Toàn màn hình"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors hidden sm:flex"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Reader Engine Canvas */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] relative overflow-hidden">
        {activeBook.format === 'epub' && (
          <EpubViewer
            book={activeBook}
            data={activeBookData}
            initialLocation={initialLocation}
            onTocReady={setToc}
            onProgressChange={(pct) => setProgressPercentage(pct)}
          />
        )}

        {activeBook.format === 'pdf' && (
          <PdfViewer
            book={activeBook}
            data={activeBookData}
            initialLocation={initialLocation}
            onProgressChange={(pct) => setProgressPercentage(pct)}
          />
        )}

        {(activeBook.format === 'mobi' ||
          activeBook.format === 'azw' ||
          activeBook.format === 'azw2' ||
          activeBook.format === 'azw3') && (
          <MobiViewer
            book={activeBook}
            data={activeBookData}
            initialLocation={initialLocation}
            onTocReady={setToc}
            onProgressChange={(pct) => setProgressPercentage(pct)}
          />
        )}

        {activeBook.format === 'txt' && (
          <div className="w-full h-full overflow-y-auto p-8 max-w-3xl mx-auto font-serif text-base leading-relaxed whitespace-pre-wrap select-text">
            {new TextDecoder('utf-8').decode(activeBookData)}
          </div>
        )}
      </main>

      {/* Bottom Progress Bar */}
      <footer className="h-7 bg-slate-900/90 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 z-30 select-none">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-3.5 h-3.5 text-blue-400" />
          <span className="uppercase font-semibold tracking-wider text-[10px] text-slate-400">
            {activeBook.format}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-24 md:w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="font-medium text-slate-300">{progressPercentage}%</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* TOC Drawer */}
      <TocDrawer
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        toc={toc}
        onSelectChapter={() => {
          // Chapter navigation is triggered via TOC href
        }}
        bookTitle={activeBook.title}
      />
    </div>
  )
}
