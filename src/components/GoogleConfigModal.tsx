import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import {
  X,
  Cloud,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Key,
  RefreshCw,
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
    isWorkerConfigured,
    setClientId,
    login,
    initAuth,
    isLoading,
  } = useAuthStore()

  const [inputClientId, setInputClientId] = useState(clientId)
  const [showManualInputs, setShowManualInputs] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [detectedKeys, setDetectedKeys] = useState<string[]>([])
  const [lastChecked, setLastChecked] = useState<string>('')

  // Check config when modal opens
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/auth/config')
      if (res.ok) {
        const data = await res.json()
        setDetectedKeys(data.detectedKeys || [])
        setLastChecked(new Date().toLocaleTimeString('vi-VN'))
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchStatus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConnect = async () => {
    setErrorMsg(null)

    // If manual client ID was typed, save it
    if (inputClientId && inputClientId.trim() !== '') {
      setClientId(inputClientId.trim())
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
    setIsRefreshing(true)
    try {
      await fetchStatus()
      await initAuth()
    } finally {
      setTimeout(() => setIsRefreshing(false), 300)
    }
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
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">
                  {isWorkerConfigured
                    ? 'BFF OAuth Server: Đã kích hoạt'
                    : 'BFF OAuth Server: Chưa nhận được Secrets'}
                </p>
                {lastChecked && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {lastChecked}
                  </span>
                )}
              </div>
              <p className="text-[11px] mt-1 text-slate-300 leading-relaxed">
                {isWorkerConfigured
                  ? 'Tài khoản người dùng sẽ đăng nhập 1-chạm mà không cần nhập bất kỳ Client ID nào.'
                  : 'Cloudflare Worker chưa tìm thấy biến GOOGLE_CLIENT_ID trong môi trường chạy.'}
              </p>
              <div className="mt-2 text-[10px] text-slate-400 font-mono bg-slate-950/60 p-2 rounded-lg border border-white/5">
                Biến Worker nhận diện được:{' '}
                {detectedKeys.length > 0 ? (
                  <span className="text-emerald-400 font-bold">{detectedKeys.join(', ')}</span>
                ) : (
                  <span className="text-rose-400 font-bold">Trống (0 biến)</span>
                )}
              </div>
            </div>
          </div>

          {/* Setup Instructions for App Owner */}
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-white/5 text-xs text-slate-300 space-y-3">
            <div className="flex items-center space-x-1.5 font-semibold text-blue-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Kiểm tra lại trên Cloudflare Dashboard:</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-400 pl-1 leading-relaxed">
              <li>
                Vào <strong>Cloudflare Dashboard</strong> ➔ <strong>Workers & Pages</strong> ➔{' '}
                <code>ebook-reader</code> ➔ tab <strong>Settings</strong> ➔{' '}
                <strong>Variables and Secrets</strong>.
              </li>
              <li>
                Đảm bảo có đủ 2 biến:
                <div className="mt-1 space-y-0.5 text-slate-300 pl-2">
                  <div>
                    • <code>GOOGLE_CLIENT_ID</code> (dán Google Client ID)
                  </div>
                  <div>
                    • <code>GOOGLE_CLIENT_SECRET</code> (dán Google Client Secret)
                  </div>
                </div>
              </li>
              <li>
                Nếu đã thêm mà vẫn báo "Trống (0 biến)", bạn hãy <strong>chụp ảnh màn hình tab Settings ➔ Variables and Secrets</strong> để đối chiếu.
              </li>
            </ol>
          </div>

          {/* Quick manual input option for instant login */}
          <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-2xl">
            <button
              type="button"
              onClick={() => setShowManualInputs(!showManualInputs)}
              className="w-full text-left text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-between"
            >
              <span className="flex items-center space-x-1.5">
                <Key className="w-4 h-4" />
                <span>Hoặc dán Client ID trực tiếp vào đây để đăng nhập ngay</span>
              </span>
              <span className="text-[11px] underline">
                {showManualInputs ? 'Ẩn' : 'Mở ô nhập'}
              </span>
            </button>

            {showManualInputs && (
              <div className="mt-3 space-y-3 animate-in fade-in pt-2 border-t border-blue-500/10">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
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
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Dán Client ID của bạn vào ô trên rồi bấm nút xanh bên dưới để đăng nhập ngay mà không cần đợi Cloudflare.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5 rounded-xl hover:bg-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRefreshing ? 'Đang kiểm tra...' : 'Làm mới trạng thái'}</span>
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
