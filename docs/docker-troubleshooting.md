# 📝 Tài Liệu Lỗi Phổ Biến & Giải Pháp Khi Triển Khai Docker (Troubleshooting)

Tài liệu này ghi chú lại các cấu hình quan trọng và các lỗi thiết yếu đã được khắc phục trong quá trình thiết lập môi trường Docker cho hệ thống Launchpad CMS (Strapi + Next.js).

---

## 1. Lỗi Không Hỗ Trợ Seed Ảnh Khi Chạy Qua Docker Exec
**🚫 Vấn đề:**
Chạy thủ công lệnh `docker exec -it <container> yarn strapi import ...` thường chỉ đẩy được Database từ file `.tar.gz` mà không thể giải nén/seed được hình ảnh vào volume `public/uploads` do các rạn nứt về giới hạn quyền truy cập (Permission) truyền dữ liệu từ Host vào Container.

**✅ Giải pháp đã triển khai:**
Cài đặt tiến trình Init bằng Entrypoint Script để Container tự chạy ngầm lúc Boot.
- **Tiến trình tự động**: Tạo file `strapi/scripts/docker-entrypoint.sh` kiểm tra cờ `SEED_DATA`.
- **Tự động Bypass (Vượt Prompt)**: Dùng cú pháp `echo "y" | yarn strapi import ...` để tự động trả lời Yes ngay lập tức thay vì hỏi người dùng lúc gõ CLI.
- **Vá lỗi Cross-Platform**: Do file Script tạo trên Windows dễ dính ký tự dòng `CRLF` (gây lỗi khi chuyển sang Linux), Dockerfile của Strapi đã được nhúng sẵn lệnh vá: `sed -i 's/\r$//'`.
- **Cách sử dụng**: Khi deploy, muốn seed dữ liệu chỉ cần thêm `SEED_DATA=true` (trong file `.env` hoặc uncomment trong `docker-compose.prod.yml`).

---

## 2. Strapi Chớp Tắt Tự Động Kết Nối Cổng Sai (ECONNREFUSED)
**🚫 Vấn đề:**
Strapi log báo lỗi: `Error: connect ECONNREFUSED 172.x.x.x:54321`.
Đương nhiên hệ thống không thể chạy do cấu hình `DATABASE_PORT` ở file `.env` dành cho máy chủ (Host) đang là `54321`. Khi đưa vào biến container qua mạng nội bộ Docker, Strapi vẫn cố tìm kết nối tới postgres cổng 54321.

**✅ Giải pháp đã triển khai:**
Nguyên tắc Overriding Networking. 
Đối với container Database (`launchpad-db`) khi giao tiếp nội mạng luôn là `5432`. Do đó đã thay đổi cứng lại biến môi trường bên trong 2 file cấu hình Docker Compose (bao gồm `docker-compose.yml` và `docker-compose.prod.yml`):
```yaml
services:
  strapi:
    environment:
      DATABASE_HOST: launchpad-db
      DATABASE_PORT: 5432 # 👈 Override luôn bằng 5432 để bỏ qua file .env khi giao tiếp nội bộ container
```

---

## 3. Lỗi 400 Bad Request Khi Ảnh Load Từ Next.js
**🚫 Vấn đề:**
Server chạy tốt, dữ liệu đã báo OK nhưng trên giao diện trang web toàn bộ ảnh hiển thị lỗi đen xì hoặc trả về HTTP 400 (`"url" parameter is not allowed`).
Lý do là Next.js (bản 14+) đã bổ sung hàng phòng ngự chống SSRF Block (Server-Side Request Forgery). Image Optimizer từ chối tải/rendering mọi đường dẫn mang định dạng IP nội bộ, localhost hoặc Private Network từ các Container khác (như `http://strapi:1337/...`).

**✅ Giải pháp đã triển khai:**
Chỉnh sửa cấu hình trực tiếp để bỏ qua chặn dải IP Private:
Thêm thuộc tính cấu hình `dangerouslyAllowLocalIP: true` vào khối `images` bên trong thẻ cấu hình của file `next/next.config.mjs`:
```javascript
  images: {
    dangerouslyAllowLocalIP: true, // 👈 Bắt buộc phải có cờ này khi Image nằm chung một Docker Private Network
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'strapi',
        port: '1337',
        pathname: '/uploads/**',
      }
    ]
  }
```
*Ghi Chú Đính Kèm: Mọi thay đổi về file `next.config.mjs` luôn mong muốn phải Rebuild lại Docker Image (vd: `docker compose build nextjs`) chứ không ăn ngay lập tức.*

---

## 4. Lỗi Rewrite Ảnh Khi Chạy Docker Compose Up
**🚫 Vấn đề:**
Khi chạy `docker compose up -d`, mặc dù server Strapi và NextJS đều lên, nhưng ảnh đôi khi vẫn báo 400 hoặc không tìm thấy do NextJS cố gắng fetch ảnh từ `NEXT_PUBLIC_API_URL` (thường trỏ về `localhost` trên trình duyệt) thay vì dùng mạng nội bộ Docker.

**✅ Giải pháp đã triển khai:**
Phân tách giữa URL Public (Client-side) và URL Internal (Server-side):
1. **Cập nhật `docker-compose.yml`**: Thêm biến `STRAPI_INTERNAL_URL: http://strapi:1337` để NextJS dùng khi Fetch/Rewrites phía Server.
2. **Cập nhật `next.config.mjs`**: Sửa logic `rewrites` để ưu tiên dùng `STRAPI_INTERNAL_URL`.
```javascript
  async rewrites() {
    const strapiUrl = process.env.STRAPI_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://strapi:1337';
    return [
      {
        source: '/uploads/:path*',
        destination: `${strapiUrl}/uploads/:path*`,
      },
    ];
  }
```
Việc này đảm bảo khi trình duyệt gọi `/uploads/abc.jpg`, Next.js Server sẽ đứng ra "bắt tay" nội bộ với container `strapi:1337` để lấy dữ liệu thay vì bắt trình duyệt phải tự tìm đường tới IP container.