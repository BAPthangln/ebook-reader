import React, { useRef } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useBookStore } from '../store/useBookStore'
import { BookOpen, Sparkles, UploadCloud } from 'lucide-react'

interface AuthLandingCardProps {
  onOpenConfigModal: () => void
  onSkipToOffline: () => void
}

export const AuthLandingCard: React.FC<AuthLandingCardProps> = ({
  onOpenConfigModal,
  onSkipToOffline,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { clientId, login, isLoading } = useAuthStore()
  const { importLocalFile, addBook } = useBookStore()

  const handleLoginClick = () => {
    // If clientId is already set (e.g. from env), start login directly
    if (clientId && clientId.trim() !== '') {
      login()
    } else {
      // If not configured yet, open modal to configure and connect
      onOpenConfigModal()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        importLocalFile(e.target.files[i])
      }
      onSkipToOffline()
    }
  }

  const handleDemoBook = async () => {
    const sampleBook = {
      id: 'demo_book_dac_nhan_tam',
      title: 'Đắc Nhân Tâm (Bản Đọc Thử Demo)',
      author: 'Dale Carnegie',
      format: 'txt' as const,
      size: 15400,
      isOffline: true,
      createdAt: Date.now(),
      lastReadAt: Date.now(),
    }

    const sampleContent = `ĐẮC NHÂN TÂM (HOW TO WIN FRIENDS AND INFLUENCE PEOPLE)
Tác giả: Dale Carnegie

CHƯƠNG 1: NẾU MUỐN THU THẬP MẬT ONG, ĐỪNG PHÁ TỔ ONG

Vào một ngày xuân năm 1931, đường phố New York xôn xao bởi một cuộc vây bắt ngoạn mục chưa từng thấy. Sau nhiều tuần lễ truy tầm, cảnh sát đã dồn được "Crowley - Hai Súng", tên sát nhân khét tiếng, vào một căn hộ của người tình y trên đại lộ West End...`

    const buffer = new TextEncoder().encode(sampleContent).buffer
    await addBook(sampleBook, buffer, 'text/plain')
    onSkipToOffline()
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".epub,.pdf,.mobi,.azw,.azw2,.azw3,.cbz,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="w-full max-w-md glass-panel rounded-3xl border border-white/10 p-8 md:p-10 shadow-2xl text-center relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* App Logo */}
        <div className="relative z-10 flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 border border-white/20 mb-4">
            <BookOpen className="w-8 h-8 drop-shadow" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            CloudBook Reader
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            Kho sách điện tử thông minh. Đọc mượt mà EPUB, PDF, Kindle MOBI trên mọi thiết bị.
          </p>
        </div>

        {/* The Single Primary Button: Login with Google */}
        <div className="relative z-10 space-y-4">
          <button
            onClick={handleLoginClick}
            disabled={isLoading}
            className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {/* Official Google 'G' icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Đang xác thực Google...' : 'Đăng nhập bằng Google'}</span>
          </button>

          {/* Secondary subtle options */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 font-medium flex items-center justify-center space-x-1.5 transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Hoặc mở file từ máy tính (.epub, .pdf, .mobi)</span>
            </button>

            <button
              onClick={handleDemoBook}
              className="text-[11px] text-slate-500 hover:text-blue-400 transition-colors inline-flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Trải nghiệm nhanh với sách mẫu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
