import React, { useRef, useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useBookStore } from '../store/useBookStore'
import { pullSyncFromDrive } from '../services/syncService'
import {
  BookOpen,
  Cloud,
  RefreshCw,
  Plus,
  Download,
  LogOut,
  ChevronDown,
  Settings,
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
  const { user, clientId, login, logout, isLoading: isAuthLoading } = useAuthStore()
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

  // Handle Google Drive connect button
  const handleConnectClick = () => {
    if (!clientId || clientId.trim() === '') {
      onOpenConfigModal()
    } else {
      login()
    }
  }

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/75 backdrop-blur-xl border-b border-white/5 transition-all">
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
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 border border-white/20">
              <BookOpen className="w-5 h-5 drop-shadow" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                CloudBook
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block font-medium">
              Thư viện sách Google Drive
            </p>
          </div>
        </div>

        {/* Right Actions Toolbar */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Add Local File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Thêm file sách từ máy tính"
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 hover:border-blue-500/40 text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm hover:shadow"
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
                className="px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <Cloud className="w-4 h-4" />
                <span className="hidden sm:inline">Quét Drive</span>
              </button>

              <button
                onClick={handleSyncCloud}
                disabled={isSyncing}
                title="Đồng bộ tiến độ đọc với Google Drive"
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 hover:border-slate-700 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </>
          ) : (
            <button
              onClick={handleConnectClick}
              disabled={isAuthLoading}
              title="Đăng nhập tài khoản Google"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all flex items-center space-x-2 shadow-lg shadow-blue-500/25 hover:scale-102 active:scale-98"
            >
              <Cloud className="w-4 h-4" />
              <span>{isAuthLoading ? 'Đang kết nối...' : 'Kết nối Google Drive'}</span>
            </button>
          )}

          {/* PWA Install Button if available */}
          {installPrompt && (
            <button
              onClick={handleInstallPWA}
              title="Cài đặt ứng dụng lên máy (PWA)"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 animate-pulse"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Cài App PWA</span>
            </button>
          )}

          {/* User Profile Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1 pl-1.5 rounded-full bg-slate-900/80 border border-white/10 hover:border-blue-500/30 transition-all"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-blue-400/80 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 glass-panel rounded-2xl shadow-2xl p-2 text-xs z-50 animate-in fade-in slide-in-from-top-2 duration-150 border border-white/10">
                  <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                    <p className="font-bold text-slate-100 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      onOpenDriveModal()
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center space-x-2.5 transition-colors"
                  >
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span>Kho sách Google Drive</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      onOpenConfigModal()
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 flex items-center space-x-2.5 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Cài đặt kết nối</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      logout()
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center space-x-2.5 transition-colors mt-1"
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
