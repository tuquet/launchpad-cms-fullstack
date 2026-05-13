# Hướng dẫn Chạy dự án tại Local (Development Guide)

Tài liệu này hướng dẫn cách cài đặt và chạy dự án LaunchPad trên máy tính cá nhân mà không cần dùng Docker cho phần ứng dụng chính (Hybrid Mode).

---

## 📋 1. Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy bạn đã cài đặt:

- **Node.js**: Phiên bản 22.x (LTS)
- **Yarn**: Phiên bản 4.5.0 (đã đi kèm trong dự án qua Corepack)
- **Docker Desktop**: Dùng để chạy Database (PostgreSQL)

---

## 🚀 2. Quy trình Cài đặt (Setup Steps)

### Bước 1: Khởi tạo môi trường

Chạy lệnh duy nhất sau tại thư mục root để tự động cài đặt dependencies, tạo file `.env` và khởi động Database:

```powershell
yarn setup
```

### Bước 2: Kiểm tra Database

Sau khi chạy setup, Database sẽ chạy tại cổng `5430`. Bạn có thể truy cập giao diện quản lý DB tại:

- **Adminer**: [http://localhost:8080](http://localhost:8080)

### Bước 3: Nạp dữ liệu mẫu (Seeding)

Nếu bạn muốn có sẵn nội dung bài viết, trang web và cấu hình mẫu:

```powershell
yarn seed
```

---

## 💻 3. Lệnh Chạy dự án (Development Commands)

Dự án hỗ trợ chạy song song cả Backend và Frontend bằng 1 lệnh duy nhất:

| Lệnh          | Mô tả                                              |
| :------------ | :------------------------------------------------- |
| `yarn dev`    | Chạy cả Strapi (1337) và Next.js (3000) đồng thời. |
| `yarn strapi` | Chỉ chạy riêng Backend (Strapi).                   |
| `yarn next`   | Chỉ chạy riêng Frontend (Next.js).                 |
| `yarn clean`  | Xóa cache của Next.js và Strapi để sửa lỗi build.  |

---

## 🛠️ 4. Thông tin Cổng kết nối (Port Mapping)

Khi chạy local, dự án sử dụng các cổng sau:

- **Next.js Frontend**: [http://localhost:3000](http://localhost:3000)
- **Strapi Backend**: [http://localhost:1337](http://localhost:1337)
- **Strapi Admin**: [http://localhost:1337/admin](http://localhost:1337/admin)
- **Postgres (External)**: `localhost:5430`

---

## 💡 5. Xử lý sự cố thường gặp (Troubleshooting)

### Lỗi: Invalid argument not valid semver

Đây là lỗi do React DevTools không tương thích với React 19.

- **Cách xử lý**: Tạm thời tắt React DevTools trong trình duyệt hoặc sử dụng bản vá đã được tích hợp trong `next/app/[locale]/layout.tsx`.

### Lỗi: 404 Chunk Not Found

Xảy ra khi Turbopack gặp lỗi cache.

- **Cách xử lý**: Chạy lệnh `yarn clean` và khởi động lại dự án.

### Lỗi: Database connection refused

- **Cách xử lý**: Đảm bảo Docker Desktop đang chạy và container `launchpad-db` đã khởi động (`docker ps`).

---

## 🐳 6. Chạy với Docker Full-Stack (Containerized Mode)

Đây là cách tốt nhất để đảm bảo môi trường chạy giống hệt như trên Server Production.

### Khởi động toàn bộ hệ thống

Sử dụng Docker Compose để build và chạy tất cả các dịch vụ (Next.js, Strapi, Postgres, Nginx, Adminer):

```powershell
docker compose up -d --build
```

### Thông tin Cổng kết nối (Docker Mode)

| Dịch vụ      | Cổng (Host) | Truy cập                                       |
| :----------- | :---------- | :--------------------------------------------- |
| **Frontend** | `3000`      | [http://localhost:3000](http://localhost:3000) |
| **Backend**  | `1337`      | [http://localhost:1337](http://localhost:1337) |
| **Database** | `5430`      | `localhost:5430` (Map từ container 5432)       |
| **Nginx**    | `80`        | [http://localhost](http://localhost)           |
| **Adminer**  | `8080`      | [http://localhost:8080](http://localhost:8080) |

### Lưu ý quan trọng khi dùng Docker:

1. **Dọn dẹp**: Để xóa sạch các container và volume cũ trước khi build mới:
   ```powershell
   docker compose down -v
   ```
2. **Rebuild**: Nếu bạn thay đổi biến môi trường (`.env`), bạn cần rebuild lại container để nhận giá trị mới:
   ```powershell
   docker compose build --no-cache nextjs strapi
   docker compose up -d
   ```
3. **Log**: Xem log của các dịch vụ để debug:
   ```powershell
   docker compose logs -f nextjs
   docker compose logs -f strapi
   ```

### Nạp dữ liệu mẫu (Seed) trong Docker

Nếu bạn đang chạy Docker và muốn nạp dữ liệu demo vào database:

```powershell
# Chạy lệnh seed bên trong container 'strapi'
# Sử dụng -u root để đảm bảo quyền ghi file (đặc biệt quan trọng trên Windows)
docker exec -it -u root strapi yarn seed
```
