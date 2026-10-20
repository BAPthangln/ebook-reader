# CloudBook PWA — Google Drive eBook Reader

Ứng dụng web đọc sách điện tử hiện đại, tích hợp trực tiếp với Google Drive cá nhân, hoạt động theo mô hình **BYOC (Bring Your Own Cloud)** và hỗ trợ chuẩn **PWA (Progressive Web App)** với khả năng đọc ngoại tuyến 100%.

![CloudBook PWA Banner](public/favicon.svg)

---

## 🌟 Tính năng nổi bật

- **Google Drive Integration**:
  - Đăng nhập 1-click bằng tài khoản Google (chuẩn Google Identity Services).
  - Quét và liệt kê tất cả các file sách điện tử sẵn có trên Google Drive (`.epub`, `.pdf`, `.mobi`, `.azw`, `.azw2`, `.azw3`, `.cbz`, `.txt`).
  - Đọc trực tiếp từ Drive mà không tốn dung lượng ổ cứng.
- **Đồng bộ tiến độ đa thiết bị (Cross-Device Sync - Zero Server Cost)**:
  - Tự động lưu tiến độ đọc (trang hiện tại, chuẩn CFI, %) lên Google Drive `appDataFolder` cá nhân.
  - Đọc trên máy tính (Laptop Web) tới trang 45, mở điện thoại (Mobile PWA) lên là hiển thị gợi ý tiếp tục đọc liền mạch!
  - Quản lý tiến độ độc lập theo ID từng cuốn sách: Đọc cùng lúc nhiều sách mà không bị lẫn lộn vị trí.
- **Hỗ trợ đa định dạng Ebook**:
  - **EPUB 2 / 3**: Dàn trang mượt mà bằng `Epub.js`, mục lục TOC, lưu vị trí CFI.
  - **PDF Documents**: Tích hợp Mozilla `PDF.js`, render canvas tốc độ cao, zoom đa cấp độ, nhảy trang nhanh.
  - **Kindle MOBI / AZW**: Giải mã PalmDOC LZ77 trực tiếp trong trình duyệt, hỗ trợ `.mobi`, `.azw`, `.azw2`, `.azw3`.
  - **Plain Text / MD**: Đọc file `.txt` với typography tối ưu.
- **Cá nhân hóa trải nghiệm đọc (Reader Ergonomics)**:
  - **Theme màu**: *Sáng (Light)*, *Sepia giấy cổ điển (chống mỏi mắt)*, *Tối (Slate Dark)*, *OLED True Black (tiết kiệm pin tối đa trên điện thoại)*, và *Bộ tự chọn màu tự do (Custom Color Picker)*.
  - **Typography**: Đầy đủ font chuyên dụng đọc sách (`Merriweather`, `Lora`, `Literata`, `Inter`, `JetBrains Mono`), tùy chỉnh cỡ chữ từ `12px` - `36px`, khoảng cách dòng (`1.3x`, `1.6x`, `1.9x`), căn đều / căn trái, chỉnh độ rộng lề.
- **PWA & Offline-First**:
  - Cài đặt 1-click lên màn hình chính máy tính (Chrome/Edge) hoặc điện thoại (iOS/Android).
  - Tải sách về bộ nhớ máy (IndexedDB) để đọc ngoại tuyến hoàn toàn khi không có mạng hoặc trên máy bay.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Frontend**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS + Lucide React Icons
- **Offline Storage**: Dexie.js (IndexedDB)
- **State Management**: Zustand
- **PWA Engine**: `vite-plugin-pwa` + Workbox Service Worker
- **Reader Engines**: `epubjs`, `pdfjs-dist`, Native PalmDOC/MOBI JS parser
- **Cloud Service**: Google Identity Services (GIS) & Google Drive API v3

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy cục bộ

### 1. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 2. Cấu hình Google Cloud (OAuth 2.0)
Tạo file `.env` từ `.env.example`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your_api_key (tùy chọn)
```
*(Lưu ý: Bạn cũng có thể cấu hình trực tiếp Client ID này từ biểu tượng Chìa khóa trên thanh công cụ của ứng dụng mà không cần sửa file `.env`)*.

#### Cách lấy Google OAuth Client ID miễn phí:
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/) và tạo 1 Project mới.
2. Vào **APIs & Services** > **Library**, tìm và bật **Google Drive API**.
3. Vào **OAuth consent screen**, chọn **External**, điền thông tin app và thêm email của bạn vào danh sách **Test Users**.
4. Vào **Credentials** > **Create Credentials** > **OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173` (khi chạy local) và URL trang web khi deploy.
5. Sao chép **Client ID** dán vào ứng dụng.

### 3. Chạy môi trường phát triển (Dev)
```bash
npm run dev
```
Mở trình duyệt tại: `http://localhost:5173`

### 4. Build sản phẩm (Production)
```bash
npm run build
```
Thư mục xuất ra nằm tại `dist/`, sẵn sàng đưa lên Vercel, Netlify hoặc GitHub Pages.

---

## 📦 Đẩy mã nguồn lên GitHub Repo

Dự án đã được liên kết với repository: `https://github.com/BAPthangln/ebook-reader.git`

```bash
git add .
git commit -m "feat: initial commit for Google Drive Ebook Reader PWA"
git push -u origin main
```
