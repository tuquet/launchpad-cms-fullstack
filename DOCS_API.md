# Hướng dẫn Giao tiếp Frontend & Backend (API Documentation)

Tài liệu này cung cấp cái nhìn tổng quan về cách Next.js (Frontend) tương tác với Strapi (Backend) trong dự án LaunchPad.

---

## 1. Kiến trúc Tổng quan
Dự án sử dụng mô hình **Headless CMS**:
- **Backend (Strapi 5)**: Quản lý nội dung, cung cấp RESTful API và Admin Panel.
- **Frontend (Next.js 15)**: Tiêu thụ API, render giao diện và tối ưu hóa hiệu năng (Server Components & Caching).

## 2. Cấu hình Kết nối
Frontend giao tiếp với Backend thông qua các biến môi trường được cấu hình trong file `.env`:

| Biến môi trường | Giá trị mặc định | Mô tả |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:1338` | URL gốc của Strapi API. |
| `PREVIEW_SECRET` | (Ngẫu nhiên) | Key dùng để xác thực chế độ xem trước (Draft Mode). |

**Base API Path**: `${NEXT_PUBLIC_API_URL}/api`

---

## 3. Cơ chế Xác thực & Bảo mật (Authentication)

### A. API công khai (Public Access)
Mặc định, các yêu cầu fetch dữ liệu từ Frontend thường được cấu hình là **Public** trong Strapi (Settings > Users & Permissions Plugin > Roles > Public). Điều này cho phép Next.js fetch nội dung mà không cần gửi Token trong header, giúp tối ưu tốc độ.

### B. API bảo mật (Authenticated Access)
Đối với các thao tác cần bảo mật hoặc nội dung riêng tư, hệ thống sử dụng **API Token (Bearer Token)**:
- **Header**: `Authorization: Bearer <YOUR_API_TOKEN>`
- Token được quản lý trong Strapi Admin Panel (Settings > API Tokens).

### C. Chế độ Xem trước (Draft Mode)
Khi biên tập viên muốn xem trước nội dung chưa xuất bản:
- Next.js sử dụng `PREVIEW_SECRET` để tạo session xem trước.
- Header `strapi-encode-source-maps: true` được gửi kèm để Strapi hiểu là đang ở chế độ preview.

---

## 4. Cách thức Fetch dữ liệu trong Code
Chúng ta không dùng `fetch` thuần túy mà sử dụng thư viện `@strapi/client` để đảm bảo Type-safety.

### File cấu trúc: `next/lib/strapi/client.ts`

### Các hàm chính:
1. **`fetchCollectionType`**: Lấy danh sách từ một Collection (ví dụ: danh sách bài viết).
2. **`fetchSingleType`**: Lấy dữ liệu của một Single Type (ví dụ: thông tin trang chủ, footer).
3. **`fetchDocument`**: Lấy chi tiết một bản ghi dựa trên `documentId`.

### Ví dụ Code:
```typescript
import { fetchCollectionType } from '@/lib/strapi/client';

// Fetch danh sách bài viết với populate các quan hệ
const articles = await fetchCollectionType('articles', {
  populate: ['cover', 'author'],
  filters: { category: 'tech' }
});
```

---

## 5. Cơ chế Caching & Revalidation
Dự án tận dụng tính năng **Next.js 15 Caching** để đạt hiệu năng tối đa:

- **Cache Life**: Mặc định nội dung được cache trong 15 phút (có thể cấu hình lại).
- **Cache Tags**: Mỗi yêu cầu được gắn tag (ví dụ: `collection-articles`).
- **On-demand Revalidation**: Khi bạn cập nhật nội dung trên Strapi, một Webhook sẽ được gửi đến Next.js để xóa cache cũ và cập nhật dữ liệu mới ngay lập tức thông qua hàm `revalidateContent`.

---

## 6. Lưu ý cho Developer
- **Populate**: Strapi 5 mặc định không trả về các quan hệ (Media, Component, Relation). Bạn **PHẢI** khai báo `populate` trong query.
- **Admin Panel**: Truy cập `http://localhost:1338/admin` để quản lý nội dung và tạo API Tokens.
- **Environment**: Đảm bảo file `.env` ở root và các folder con đã được tạo thông qua lệnh `yarn setup`.
