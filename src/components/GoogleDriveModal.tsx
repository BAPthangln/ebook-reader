import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useBookStore, detectFormatFromFilename } from '../store/useBookStore'
import { listDriveEbooks } from '../services/googleDrive'
import type { DriveFileItem, Book } from '../types'
import {
  X,
  RefreshCw,
  Search,
  Cloud,
  Check,
  Plus,
  Loader2,
  FileText,
  BookOpen,
} from 'lucide-react'

interface GoogleDriveModalProps {
  isOpen: boolean
  onClose: () => void
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuthStore()
  const { books, addBook } = useBookStore()

  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  // Keep track of which Drive file IDs are already in library
  useEffect(() => {
    const existing = new Set(books.map((b) => b.driveFileId || b.id))
    setAddedIds(existing)
  }, [books])

  const loadDriveFiles = async () => {
    if (!user?.accessToken) return
    setIsLoading(true)
    setError(null)

    try {
      const files = await listDriveEbooks(user.accessToken)
      setDriveFiles(files)
      setIsLoading(false)
    } catch (err) {
      console.error('Lỗi khi quét Google Drive:', err)
      setError(
        err instanceof Error ? err.message : 'Không thể tải danh sách tệp từ Google Drive.'
      )
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && user?.accessToken) {
      loadDriveFiles()
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const handleAddBook = async (file: DriveFileItem) => {
    const format = detectFormatFromFilename(file.name)
    const cleanTitle = file.name.replace(/\.[^/.]+$/, '')

    const newBook: Book = {
      id: file.id,
      title: cleanTitle,
      format,
      driveFileId: file.id,
      size: file.size ? parseInt(file.size, 10) : undefined,
      coverUrl: file.thumbnailLink,
      isOffline: false,
      createdAt: Date.now(),
      lastReadAt: Date.now(),
    }

    await addBook(newBook)
    setAddedIds((prev) => new Set([...prev, file.id]))
  }

  const handleAddAll = async () => {
    for (const file of filteredFiles) {
      if (!addedIds.has(file.id)) {
        await handleAddBook(file)
      }
    }
  }

  const filteredFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return ''
    const bytes = parseInt(bytesStr, 10)
    if (isNaN(bytes)) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Kho sách Google Drive</h3>
              <p className="text-xs text-slate-400">
                Tìm thấy {driveFiles.length} tệp ebook (.epub, .pdf, .mobi) trên Drive của bạn
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadDriveFiles}
              disabled={isLoading}
              title="Quét lại Drive"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-slate-900/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lọc sách trên Drive..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {filteredFiles.some((f) => !addedIds.has(f.id)) && (
            <button
              onClick={handleAddAll}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors shrink-0 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm tất cả vào Thư viện</span>
            </button>
          )}
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <p className="text-sm">Đang quét các file Ebook trên Google Drive...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-rose-400 bg-rose-950/20 rounded-xl border border-rose-900/40">
              {error}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Không tìm thấy file sách nào trên Google Drive của bạn. Bạn hãy tải các file .epub, .pdf hoặc .mobi lên Google Drive nhé!
            </div>
          ) : (
            filteredFiles.map((file) => {
              const format = detectFormatFromFilename(file.name)
              const isAdded = addedIds.has(file.id)

              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 overflow-hidden pr-3">
                    <div className="p-2 rounded-lg bg-slate-700/60 text-blue-400 shrink-0">
                      {format === 'pdf' ? (
                        <FileText className="w-5 h-5 text-rose-400" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        <span className="uppercase font-bold text-[10px] text-blue-400">
                          {format}
                        </span>
                        {file.size && <span>• {formatFileSize(file.size)}</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isAdded ? (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã có trong thư viện</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddBook(file)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm vào thư viện</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
