# Hướng Dẫn Phát Triển Nội Bộ (Local Development Guide)

Tài liệu này hướng dẫn chi tiết quy trình phát triển trên máy cá nhân (Local) cho dự án LaunchPad CMS Fullstack. Tài liệu giải thích cấu trúc Ranh giới Mạng (Network Boundary) giữa Next.js (SSR) và Strapi, giúp Lập trình viên (đặc biệt là Kiến trúc sư Frontend) cấu hình môi trường một cách chuẩn xác và chuyên nghiệp nhất.

---

## 1. Kiến trúc Ranh giới Mạng (Network Boundary giữa Next.js & Strapi)

Hệ thống của chúng ta sử dụng Next.js (có khả năng Trình xuất phía Máy chủ - Server-Side Rendering) và Strapi làm Hệ quản trị nội dung (Headless CMS). Khi phát triển kết hợp với Docker, bạn phải hiểu rõ ranh giới mạng giữa 2 môi trường thực thi của Next.js:

1. **Môi trường Trình duyệt (Phía Máy khách - Client-Side):** Trình duyệt của người dùng (hoặc máy tính đang code) giao tiếp trực tiếp với Strapi thông qua Cổng (Port) đã được mở ra máy chủ nội bộ (máy Host).
   - Biến môi trường: `NEXT_PUBLIC_API_URL`
   - Giá trị trên máy cá nhân (Local): `http://localhost:1337`

2. **Môi trường Máy chủ Node.js (Phía Máy chủ - Server-Side):** Quá trình tải dữ liệu (fetch API) diễn ra tại Máy chủ của Next.js (trong lúc kết xuất `getStaticProps`, Server Components, v.v.).
   - Biến môi trường: `STRAPI_INTERNAL_URL`
   - Khi chạy Next.js **bên trong Docker**: Phải gọi qua hệ thống phân giải tên miền nội bộ của Docker (Docker DNS) là `http://strapi:1337`.
   - Khi chạy Next.js **trên máy cá nhân** (lệnh `npm run dev`): Phải gọi qua Localhost (`http://localhost:1337`).

---

## 2. Các Mô Hình Phát Triển Trên Máy Cá Nhân

Dựa trên nhu cầu của đội ngũ, chúng ta có 2 mô hình phát triển chính:

### Mô Hình 1: Hoàn toàn trên máy cá nhân (Khuyên dùng cho Lập trình viên Fullstack)
Ở mô hình này, chỉ có Cơ sở dữ liệu (PostgreSQL) chạy trong Docker. Cả Next.js và Strapi đều chạy trực tiếp trên máy tính cá nhân thông qua NodeJS để tận dụng tính năng Tải lại nhanh (Hot-Reload).

**Quy trình thực hiện:**
1. Khởi động riêng Cơ sở dữ liệu:
   ```bash
   docker compose up -d launchpad-db
   ```
2. Cài đặt các thư viện (đứng tại thư mục gốc):
   ```bash
   yarn setup
   ```
3. Khởi chạy song song cả Next.js và Strapi bằng công cụ concurrently (đứng tại thư mục gốc):
   ```bash
   yarn dev
   ```

**Cấu hình biến môi trường (`next/.env.local`):**
Không cần định nghĩa `STRAPI_INTERNAL_URL`, hệ thống sẽ tự động sử dụng giá trị mặc định từ `NEXT_PUBLIC_API_URL`.
```env
NEXT_PUBLIC_API_URL=http://localhost:1337
```

---

### Mô Hình 2: Mô hình Lai (Khuyên dùng cho Lập trình viên chuyên Frontend)
Ở mô hình này, phần Backend (Strapi + Cơ sở dữ liệu) chạy hoàn toàn trong Docker. Lập trình viên Frontend chỉ cần chạy Next.js ở máy cá nhân để làm giao diện (UI), không cần quan tâm đến mã nguồn của Strapi.

**Quy trình thực hiện:**
1. Khởi động toàn bộ cụm Backend (Strapi + Cơ sở dữ liệu) bằng Docker:
   ```bash
   docker compose up -d strapi launchpad-db
   ```
2. Mở cửa sổ dòng lệnh (terminal) mới, di chuyển vào thư mục `next/`:
   ```bash
   cd next
   yarn dev
   ```

**Cấu hình biến môi trường Cực Kỳ Quan Trọng (`next/.env.local`):**
Vì Next.js đang chạy trên máy cá nhân (ngoài Docker), hàm tải dữ liệu phía máy chủ (SSR) của Next.js không thể hiểu tên miền `strapi`. Do đó, bạn BẮT BUỘC phải ghi đè (override) `STRAPI_INTERNAL_URL` thành `localhost`.

Tạo hoặc sửa file `next/.env.local` như sau:
```env
# Dành cho trình duyệt (Client Components)
NEXT_PUBLIC_API_URL=http://localhost:1337

# BẮT BUỘC ghi đè để Next.js SSR tải dữ liệu API từ máy cá nhân thay vì Docker Internal DNS
STRAPI_INTERNAL_URL=http://localhost:1337
```

---

## 3. Quy trình Khắc Phục Sự Cố Thường Gặp

### 1. Lỗi `ENOTFOUND strapi` hoặc `FetchError` khi tải trang
- **Nguyên nhân:** Máy chủ Next.js đang cố gắng gọi API bằng `http://strapi:1337` nhưng do bạn đang chạy Next.js trên máy cá nhân (Mô hình 1 hoặc 2), máy cá nhân không có tên miền `strapi`.
- **Cách khắc phục:** 
  - Đảm bảo trong file `next/.env.local` đã có dòng `STRAPI_INTERNAL_URL=http://localhost:1337`.
  - Khởi động lại máy chủ Next.js (nhấn `Ctrl + C` và chạy lại lệnh `yarn dev`).

### 2. Next.js không tải được hình ảnh từ Strapi
- **Nguyên nhân:** Tên miền của Strapi cung cấp (localhost hoặc tên miền riêng) chưa được cấu hình trong mục `images.remotePatterns` của file `next.config.mjs`.
- **Cách khắc phục:** Hệ thống đã được cấu hình sẵn cho phép IP nội bộ và tên miền `localhost:1337` cũng như `strapi:1337`. Nếu bạn đổi cổng (port), hãy cập nhật lại file `next.config.mjs`.

### 3. Lỗi Xung đột Cổng (Address already in use)
- **Nguyên nhân:** Xung đột khi bạn vừa chạy Strapi bằng Docker (`docker compose up strapi`), vừa chạy lệnh `yarn dev` ở máy cá nhân (có chứa tập lệnh khởi động Strapi trên máy).
- **Cách khắc phục:** 
  - Nếu chọn Mô Hình 2 (Strapi chạy bằng Docker), bạn CHỈ được chạy lệnh `yarn dev` bên trong thư mục `/next`, không được chạy `yarn dev` ở thư mục gốc của dự án.

