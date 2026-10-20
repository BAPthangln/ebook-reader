import React, { useRef } from 'react'
import { useBookStore } from '../../store/useBookStore'
import { useAuthStore } from '../../store/useAuthStore'
import {
  BookOpen,
  Cloud,
  UploadCloud,
  Sparkles,
} from 'lucide-react'

interface EmptyStateProps {
  onOpenDriveModal: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onOpenDriveModal }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importLocalFile, addBook } = useBookStore()
  const { user, login } = useAuthStore()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        importLocalFile(e.target.files[i])
      }
    }
  }

  // Load a demo EPUB book for immediate testing
  const handleLoadDemoBook = async () => {
    // We create a sample text/html book in IndexedDB for instant testing
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

Vào một ngày xuân năm 1931, đường phố New York xôn xao bởi một cuộc vây bắt ngoạn mục chưa từng thấy. Sau nhiều tuần lễ truy tầm, cảnh sát đã dồn được "Crowley - Hai Súng", tên sát nhân khét tiếng, vào một căn hộ của người tình y trên đại lộ West End.

Một trăm năm mươi cảnh sát và mật vụ bao vây tầng cao nhất của tòa nhà. Họ khoét lỗ trên mái nhà và bắn hơi cay vào bên trong, cố tống cổ tên sát thủ ra ngoài. Trong suốt hơn một giờ đồng hồ, khu dân cư sang trọng bậc nhất New York rền vang bởi tiếng súng máy và súng trường.

Crowley ngồi sau một chiếc ghế bành nệm dày, liên tục nã đạn vào cảnh sát. Khi bị bắt, Crowley bị thương nặng, máu chảy đầm đìa. Nhưng bạn có biết trong lúc đang chiến đấu sinh tử với cảnh sát, y đã viết một bức thư gởi cho ai không?

Trong khi đạn bay rào rào quanh mình, Crowley đã viết một bức thư ngỏ: "Dưới chiếc áo này là một trái tim mệt mỏi, nhưng là một trái tim nhân hậu - một trái tim không bao giờ muốn làm tổn thương bất cứ ai."

...

Bài học cốt lõi:
"Chỉ trích là vô bổ vì nó đặt người khác vào thế phòng thủ và khiến họ cố gắng tự bào chữa. Chỉ trích là nguy hiểm vì nó làm tổn thương lòng kiêu hãnh quý giá của con người và gây ra sự phẫn nộ oán giận."

Nếu bạn muốn thay đổi ai đó, hãy bắt đầu bằng sự thấu hiểu và khen ngợi chân thành.`

    const buffer = new TextEncoder().encode(sampleContent).buffer
    await addBook(sampleBook, buffer, 'text/plain')
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center max-w-xl mx-auto my-12 bg-slate-800/40 border border-slate-700/60 rounded-3xl backdrop-blur-sm">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".epub,.pdf,.mobi,.azw,.azw2,.azw3,.cbz,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mb-5 shadow-lg shadow-blue-500/20">
        <BookOpen className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-slate-100 mb-2">Thư viện của bạn đang trống</h3>
      <p className="text-sm text-slate-400 mb-8 max-w-md">
        Kết nối Google Drive để đồng bộ các file ebook của bạn, hoặc thêm file từ máy tính để bắt đầu đọc ngay lập tức.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        {/* Drive Sync Button */}
        {user ? (
          <button
            onClick={onOpenDriveModal}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-600/20"
          >
            <Cloud className="w-4 h-4" />
            <span>Mở kho sách trên Google Drive</span>
          </button>
        ) : (
          <button
            onClick={login}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-600/20"
          >
            <Cloud className="w-4 h-4" />
            <span>Đăng nhập Google để quét sách</span>
          </button>
        )}

        {/* Local File Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm flex items-center justify-center space-x-2 transition-all border border-slate-600/60"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Thêm file từ máy tính (.epub, .pdf, .mobi)</span>
        </button>
      </div>

      {/* Demo book quick link */}
      <div className="mt-6 pt-5 border-t border-slate-700/50 w-full flex items-center justify-center">
        <button
          onClick={handleLoadDemoBook}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1.5 transition-colors group"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Chưa có file sách? Bấm vào đây để nạp 1 cuốn đọc thử ngay</span>
        </button>
      </div>
    </div>
  )
}
