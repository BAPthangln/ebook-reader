import React, { useEffect, useState } from 'react'
import { Navbar } from './components/Navbar'
import { LibraryFilters } from './components/Library/LibraryFilters'
import { BookGrid } from './components/Library/BookGrid'
import { ContinueReadingHero } from './components/Library/ContinueReadingHero'
import { ReaderContainer } from './components/Reader/ReaderContainer'
import { GoogleDriveModal } from './components/GoogleDriveModal'
import { GoogleConfigModal } from './components/GoogleConfigModal'
import { SyncPromptBanner } from './components/SyncPromptBanner'
import { useBookStore } from './store/useBookStore'
import { useAuthStore } from './store/useAuthStore'
import { pullSyncFromDrive } from './services/syncService'
import type { ReadingProgress } from './types'
import { AlertCircle, X } from 'lucide-react'

export const App: React.FC = () => {
  const { activeBook, loadBooks, error: bookError, clearError: clearBookError } = useBookStore()
  const { user, error: authError, clearError: clearAuthError } = useAuthStore()

  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [syncPrompt, setSyncPrompt] = useState<{
    bookId: string
    progress: ReadingProgress
  } | null>(null)

  // Initial load
  useEffect(() => {
    loadBooks()
  }, [loadBooks])

  // Check cloud sync on mount or when user logs in
  useEffect(() => {
    if (user?.accessToken) {
      pullSyncFromDrive().then(({ promptBook, updatedBooksCount }) => {
        if (updatedBooksCount > 0) {
          loadBooks()
        }
        if (promptBook) {
          setSyncPrompt(promptBook)
        }
      })
    }
  }, [user, loadBooks])

  const errorMessage = bookError || authError

  return (
    <div className="min-h-screen ambient-bg text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* If reading a book, show ReaderContainer */}
      {activeBook ? (
        <ReaderContainer />
      ) : (
        /* Otherwise show Library Dashboard */
        <>
          <Navbar
            onOpenDriveModal={() => setIsDriveModalOpen(true)}
            onOpenConfigModal={() => setIsConfigModalOpen(true)}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
            {/* Error toast banner if any */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 flex items-center justify-between text-xs animate-in fade-in shadow-xl backdrop-blur-md">
                <div className="flex items-center space-x-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
                <button
                  onClick={() => {
                    clearBookError()
                    clearAuthError()
                  }}
                  className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/40 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Spotlight Banner: Continue Reading */}
            <ContinueReadingHero />

            {/* Library filters and book grid */}
            <LibraryFilters />
            <BookGrid onOpenDriveModal={() => setIsDriveModalOpen(true)} />
          </main>

          {/* Modals */}
          <GoogleDriveModal
            isOpen={isDriveModalOpen}
            onClose={() => setIsDriveModalOpen(false)}
          />

          <GoogleConfigModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
          />

          {/* Cross device sync prompt */}
          <SyncPromptBanner
            prompt={syncPrompt}
            onDismiss={() => setSyncPrompt(null)}
          />
        </>
      )}
    </div>
  )
}

export default App
