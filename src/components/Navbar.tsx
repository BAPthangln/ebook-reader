import React, { useRef, useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useBookStore } from '../store/useBookStore'
import { pullSyncFromDrive } from '../services/syncService'
import {
  BookOpen,
  Cloud,
  RefreshCw,
  Plus,
  Key,
  Download,
  LogOut,
} from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface NavbarProps {
  onOpenDriveModal: () => void
  onOpenConfigModal: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDriveModal,
  onOpenConfigModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, login, logout, isLoading: isAuthLoading } = useAuthStore()
  const { importLocalFile, loadBooks } = useBookStore()

  const [isSyncing, setIsSyncing] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Listen for PWA installation prompt
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstallPWA = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  const handleSyncCloud = async () => {
    setIsSyncing(true)
    try {
      const result = await pullSyncFromDrive()
      if (result.updatedBooksCount > 0) {
        await loadBooks()
      }
    } finally {
      setIsSyncing(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        importLocalFile(e.target.files[i])
      }
    }
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".epub,.pdf,.mobi,.azw,.azw2,.azw3,.cbz,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-bold text-base tracking-tight text-white">CloudBook</h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
              Google Drive eBook Reader
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Add Local File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Thêm sách từ máy tính"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-medium transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            <span className="hidden md:inline">Thêm sách</span>
          </button>

          {/* Sync / Open Drive Button */}
          {user ? (
            <>
              <button
                onClick={onOpenDriveModal}
                title="Mở kho sách trên Google Drive"
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors flex items-center space-x-1.5"
              >
                <Cloud className="w-4 h-4" />
                <span className="hidden sm:inline">Quét Drive</span>
              </button>

              <button
                onClick={handleSyncCloud}
                disabled={isSyncing}
                title="Đồng bộ tiến độ đọc với Google Drive"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </>
          ) : (
            <button
              onClick={login}
              disabled={isAuthLoading}
              title="Đăng nhập tài khoản Google"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center space-x-1.5 shadow-md shadow-blue-600/20"
            >
              <Cloud className="w-4 h-4" />
              <span>{isAuthLoading ? 'Đang kết nối...' : 'Kết nối Google Drive'}</span>
            </button>
          )}

          {/* Config Google API Key/ID */}
          <button
            onClick={onOpenConfigModal}
            title="Cài đặt Google OAuth & Client ID"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors"
          >
            <Key className="w-4 h-4" />
          </button>

          {/* PWA Install Button if supported & not installed yet */}
          {installPrompt && (
            <button
              onClick={handleInstallPWA}
              title="Cài đặt ứng dụng lên máy (PWA)"
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center space-x-1.5 animate-pulse"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Cài App PWA</span>
            </button>
          )}

          {/* Google User Avatar / Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-blue-400 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-700/60 mb-1">
                    <p className="font-semibold text-slate-200 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      onOpenDriveModal()
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 flex items-center space-x-2 transition-colors"
                  >
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span>Kho sách Google Drive</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      logout()
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-rose-400 hover:bg-slate-700/60 flex items-center space-x-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
