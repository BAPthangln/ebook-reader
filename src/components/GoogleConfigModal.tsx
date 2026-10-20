import React, { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { X, Cloud, ExternalLink, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react'

interface GoogleConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConnected?: () => void
}

export const GoogleConfigModal: React.FC<GoogleConfigModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const { clientId, apiKey, setClientId, setApiKey, login, isLoading } = useAuthStore()

  const [inputClientId, setInputClientId] = useState(clientId)
  const [inputApiKey, setInputApiKey] = useState(apiKey)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  // Connect action: saves config and initiates connection in 1 step!
  const handleConnect = async () => {
    if (!inputClientId || inputClientId.trim() === '') {
      setErrorMsg('Vui lòng nhập Google Client ID để kết nối.')
      return
    }

    setErrorMsg(null)
    setClientId(inputClientId.trim())
    if (inputApiKey) setApiKey(inputApiKey.trim())

    try {
      await login()
      onClose()
      onConnected?.()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Kết nối Google thất bại.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Kết nối Google Drive</h3>
              <p className="text-xs text-slate-400">Xác thực tài khoản và cấp quyền đọc sách</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Google OAuth Client ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="123456789-xxxxxxxx.apps.googleusercontent.com"
              value={inputClientId}
              onChange={(e) => setInputClientId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Google API Key (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="AIzaSy..."
              value={inputApiKey}
              onChange={(e) => setInputApiKey(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-colors"
            />
          </div>

          {/* Quick Guide */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 text-xs text-slate-300 space-y-2">
            <div className="flex items-center space-x-1.5 font-semibold text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Cách lấy Google Client ID (1 lần duy nhất):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
              <li>
                Vào{' '}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline inline-flex items-center"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>{' '}
                ➜ Tạo Project.
              </li>
              <li>Bật <strong>Google Drive API</strong>.</li>
              <li>Tạo <strong>OAuth 2.0 Client ID</strong> loại <em>Web Application</em>.</li>
              <li>Dán Client ID vào ô trên rồi bấm nút <strong>"Kết nối"</strong> bên dưới.</li>
            </ol>
          </div>
        </div>

        {/* Footer: Single Action "Kết nối" */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Hủy
          </button>

          {/* Single Action Button: "Kết nối" */}
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center space-x-2 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kết nối...</span>
              </>
            ) : (
              <>
                <span>Kết nối</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
