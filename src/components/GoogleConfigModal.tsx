import React, { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { X, Key, ExternalLink, Check, ShieldCheck } from 'lucide-react'

interface GoogleConfigModalProps {
  isOpen: boolean
  onClose: () => void
}

export const GoogleConfigModal: React.FC<GoogleConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { clientId, apiKey, setClientId, setApiKey } = useAuthStore()

  const [inputClientId, setInputClientId] = useState(clientId)
  const [inputApiKey, setInputApiKey] = useState(apiKey)
  const [isSaved, setIsSaved] = useState(false)

  if (!isOpen) return null

  const handleSave = () => {
    setClientId(inputClientId.trim())
    setApiKey(inputApiKey.trim())
    setIsSaved(true)
    setTimeout(() => {
      setIsSaved(false)
      onClose()
    }, 1000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Cấu hình Google Drive API</h3>
              <p className="text-xs text-slate-400">Kết nối tài khoản Google Cloud của bạn</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Google OAuth Client ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="123456789-xxxxxxxx.apps.googleusercontent.com"
              value={inputClientId}
              onChange={(e) => setInputClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
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
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Quick Guide */}
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-2">
            <div className="flex items-center space-x-1.5 font-semibold text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Hướng dẫn lấy Google Client ID (Miễn phí 100%):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
              <li>
                Truy cập{' '}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline inline-flex items-center"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>{' '}
                và tạo Project mới.
              </li>
              <li>Bật <strong>Google Drive API</strong> trong thư viện API.</li>
              <li>Tại mục <strong>Credentials</strong>, tạo <strong>OAuth 2.0 Client ID</strong> loại <em>Web Application</em>.</li>
              <li>Thêm URL origin: <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">http://localhost:5173</code> (khi dev).</li>
              <li>Copy Client ID dán vào ô bên trên rồi ấn Lưu!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Client ID được lưu an toàn trên máy bạn (LocalStorage).
          </p>

          <button
            onClick={handleSave}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center space-x-1.5 ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã lưu thành công!</span>
              </>
            ) : (
              <span>Lưu cấu hình</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
