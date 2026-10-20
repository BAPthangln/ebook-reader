import React, { useEffect, useState } from 'react'
import { Navbar } from './components/Navbar'
import { LibraryFilters } from './components/Library/LibraryFilters'
import { BookGrid } from './components/Library/BookGrid'
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
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

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
            {/* Error toast banner if any */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => {
                    clearBookError()
                    clearAuthError()
                  }}
                  className="p-1 text-rose-400 hover:text-rose-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

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
