# Study4YouV2 - TOEIC Learning & Admin Management Platform

Study4YouV2 là một nền tảng học tập và luyện thi TOEIC thông minh, tích hợp AI để hỗ trợ việc tạo câu hỏi, quản lý người dùng và cung cấp phản hồi chi tiết cho học viên. Dự án được xây dựng với kiến trúc hiện đại, hỗ trợ đa ngôn ngữ và giao diện quản trị mạnh mẽ.

## 🚀 Công nghệ sử dụng

### Frontend
- **Framework**: React.js with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS / Shadcn UI
- **Animations**: Framer Motion
- **State Management**: React Query / Context API
- **Internationalization**: i18next (Hỗ trợ: EN, VI, ZH, JA, KO)
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend
- **Language**: Java
- **Framework**: Spring Boot
- **Build Tool**: Maven
- **Database**: PostgreSQL / MySQL
- **Security**: Spring Security & JWT

## ✨ Tính năng chính

- **Quản trị viên (Admin)**:
    - Dashboards phân tích dữ liệu.
    - Quản lý người dùng và phân quyền (Roles/Permissions).
    - Ngân hàng câu hỏi (Question Bank) hỗ trợ 7 Part TOEIC.
    - Quản lý bài thi (Mock Tests).
    - **Quản lý thông báo (Notification Management)**: Gửi thông báo đa ngôn ngữ tới toàn bộ hệ thống hoặc người dùng cụ thể.
    - **AI Generator**: Tự động tạo câu hỏi TOEIC và tạo người dùng giả lập bằng AI.
- **Học viên (Student)**:
    - Luyện tập kỹ năng: Reading, Listening, Speaking.
    - Làm bài thi thử full TOEIC (200 câu).
    - Phản hồi AI cho kỹ năng Speaking.
    - Chatbot hỗ trợ thông minh.

## 🛠 Hướng dẫn cài đặt & Khởi chạy

Để chạy dự án đầy đủ sau mỗi lần khởi động máy, bạn cần chạy 3 Terminal riêng biệt:

### 1. Backend (Java Spring Boot)
```bash
# Di chuyển vào folder backend (nếu dùng terminal)
mvn spring-boot:run
```
*Hoặc nhấn nút **Run** trong IntelliJ.*

### 2. Frontend (React Vite)
```bash
cd frontend
npm install
npm run dev
```
*Lưu ý: Đảm bảo file `vite.config.ts` đã được cấu hình port 5173.*

### 3. Public Internet (Cloudflare Tunnel)
```bash
cloudflared tunnel --url http://localhost:5173
```

## 🌍 Đa ngôn ngữ (i18n)

Dự án sử dụng `i18next` giúp dễ dàng mở rộng thị trường quốc tế.
Các tệp ngôn ngữ: `frontend/src/i18n/[en|vi|zh|ja|ko].ts`

Khi thêm tính năng mới, hãy cập nhật key vào tất cả các file này để đảm bảo giao diện đồng bộ.

---
*Dự án được xây dựng bởi đội ngũ Study4You.*
