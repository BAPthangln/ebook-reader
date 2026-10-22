import React, { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import {
  X,
  Cloud,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Key,
} from 'lucide-react'

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
  const {
    clientId,
    apiKey,
    isWorkerConfigured,
    setClientId,
    setApiKey,
    login,
    initAuth,
    isLoading,
  } = useAuthStore()

  const [inputClientId, setInputClientId] = useState(clientId)
  const [inputApiKey, setInputApiKey] = useState(apiKey)
  const [showManualInputs, setShowManualInputs] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConnect = async () => {
    setErrorMsg(null)

    // If manual client ID was typed, save it
    if (inputClientId && inputClientId.trim() !== '') {
      setClientId(inputClientId.trim())
    }
    if (inputApiKey && inputApiKey.trim() !== '') {
      setApiKey(inputApiKey.trim())
    }

    try {
      await login()
      onClose()
      onConnected?.()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Kết nối Google thất bại.')
    }
  }

  const handleRefreshStatus = async () => {
    await initAuth()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Kết nối Google OAuth & Drive</h3>
              <p className="text-xs text-slate-400">Xác thực tài khoản và đồng bộ sách</p>
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
        <div className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Worker OAuth Status Banner */}
          <div
            className={`p-4 rounded-2xl border text-xs flex items-start space-x-3 ${
              isWorkerConfigured
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            }`}
          >
            {isWorkerConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {isWorkerConfigured
                  ? 'BFF OAuth Server: Đã kích hoạt'
                  : 'BFF OAuth Server: Chưa cấu hình Secrets'}
              </p>
              <p className="text-[11px] mt-1 text-slate-300 leading-relaxed">
                {isWorkerConfigured
                  ? 'Tài khoản người dùng sẽ đăng nhập 1-chạm mà không cần nhập bất kỳ Client ID nào. Dữ liệu được bảo mật qua Cloudflare Worker.'
                  : 'Cần cấu hình biến môi trường GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trên Cloudflare Worker để người dùng đăng nhập tự động.'}
              </p>
            </div>
          </div>

          {/* Setup Instructions for App Owner */}
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-white/5 text-xs text-slate-300 space-y-3">
            <div className="flex items-center space-x-1.5 font-semibold text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Hướng dẫn cấu hình dành cho Quản trị viên (1 lần duy nhất):</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-400 pl-1 leading-relaxed">
              <li>
                Vào{' '}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline inline-flex items-center hover:text-blue-300"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>{' '}
                ➜ Tạo OAuth Client ID (loại Web Application).
              </li>
              <li>
                Thêm <strong>Authorized Redirect URI</strong>:
                <code className="block my-1.5 p-2 bg-slate-900 rounded-lg text-emerald-400 font-mono text-[11px] select-all break-all border border-white/5">
                  https://ebook-reader.tqttno1.workers.dev/api/auth/callback
                </code>
              </li>
              <li>
                Vào <strong>Cloudflare Dashboard</strong> ➜ Workers & Pages ➜{' '}
                <code>ebook-reader</code> ➜ <strong>Settings</strong> ➜{' '}
                <strong>Variables and Secrets</strong>, thêm 2 Secret:
                <div className="mt-1 space-y-0.5 text-slate-300 pl-2">
                  <div>
                    • <code>GOOGLE_CLIENT_ID</code>
                  </div>
                  <div>
                    • <code>GOOGLE_CLIENT_SECRET</code>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          {/* Developer manual override toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowManualInputs(!showManualInputs)}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline inline-flex items-center space-x-1"
            >
              <Key className="w-3 h-3" />
              <span>
                {showManualInputs
                  ? 'Ẩn thiết lập Client ID thủ công'
                  : 'Cấu hình Client ID thủ công (dành cho thử nghiệm local)'}
              </span>
            </button>

            {showManualInputs && (
              <div className="mt-3 p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-3 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Google OAuth Client ID
                  </label>
                  <input
                    type="text"
                    placeholder="xxxx.apps.googleusercontent.com"
                    value={inputClientId}
                    onChange={(e) => setInputClientId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Google API Key (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="AIzaSy..."
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleRefreshStatus}
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Làm mới trạng thái
          </button>

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
                <span>Bắt đầu Đăng nhập Google</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
