# 🚀 LaunchPad - Enterprise CMS Fullstack

![LaunchPad](./LaunchPad.jpg)

**LaunchPad** là giải pháp Headless CMS toàn diện, kết hợp sức mạnh quản trị nội dung của **Strapi 5 (Backend)** và hiệu năng hiển thị vượt trội của **Next.js 16 (Frontend)**. 

Hệ thống được thiết kế theo chuẩn **B2B SaaS Enterprise**, đóng gói hoàn chỉnh bằng Docker với tiêu chí: *Nhanh chóng, Bảo mật, Dễ dàng mở rộng và Sẵn sàng cho Production.*

---

## ✨ Điểm nổi bật của Nền tảng

- 🏗️ **Kiến trúc Headless:** Tách biệt hoàn toàn Frontend và Backend, giúp dễ dàng tích hợp thêm Mobile App hoặc hệ thống thứ 3.
- ⚡ **Tối ưu SEO & Hiệu năng:** Sử dụng Next.js App Router, SSR (Server-Side Rendering) và cơ chế Caching thông minh (On-demand Revalidation).
- 🛡️ **Bảo mật tối đa:** Các dịch vụ cốt lõi (Database, CMS) ẩn hoàn toàn trong mạng nội bộ Docker (Private Network), chặn đứng nguy cơ tấn công trực tiếp.
- 🚀 **Zero-Build Deployment:** Triển khai lên VPS Production không tốn tài nguyên Build, đảm bảo Server cấu hình thấp (1-2GB RAM) vẫn chạy mượt mà.

---

## 🎯 Trải nghiệm Nhanh (Dành cho Khách hàng)

Để khởi chạy toàn bộ nền tảng trên máy tính cá nhân của bạn, bạn có thể chọn 1 trong 2 cách sau:

### Cách 1: Cài đặt tự động "1 Chạm" (Khuyên dùng)
Dự án đã tích hợp sẵn Script tự động kiểm tra cấu hình, Build hệ thống và nạp dữ liệu mẫu. Bạn chỉ cần gõ:

```bash
bash scripts/install.sh
```

### Cách 2: Cài đặt từng bước (Dành cho Developer)
Dành cho những ai muốn tự tay khởi chạy và kiểm soát từng tiến trình.

**1. Sinh cấu hình và mật khẩu ngẫu nhiên:**
```bash
bash scripts/copy-env.sh --env dev
```

**2. Khởi động hệ thống (Build từ mã nguồn):**
```bash
docker compose up -d --build
```

**3. Nạp dữ liệu mẫu (Demo Data):**
```bash
docker compose exec strapi sh -c 'echo "y" | yarn strapi import -f ./data/export_20250116105447.tar.gz --force'
```

### Cuối cùng: Truy cập và Trải nghiệm
Mở trình duyệt và truy cập vào các đường dẫn sau *(thay `localhost` bằng IP VPS nếu chạy trên máy chủ)*:

- 🌐 **Giao diện Người dùng (Frontend):** [http://localhost:3000](http://localhost:3000)
- 🛠️ **Trang Quản trị Nội dung (Strapi Admin):** [http://localhost:1337/admin](http://localhost:1337/admin)
- 🗄️ **Quản trị Cơ sở dữ liệu (Adminer):** [http://localhost:8080](http://localhost:8080)
- 📖 **Tài liệu API (Swagger):** [http://localhost:1337/documentation/v1.0.0](http://localhost:1337/documentation/v1.0.0)

*(Tài khoản đăng nhập quản trị CMS được cung cấp riêng hoặc bạn có thể tự tạo trong lần truy cập đầu tiên).*

---

## 💻 Dành cho Đội ngũ Kỹ thuật (Developer Guide)

Phần này tóm tắt các quy trình vận hành và kỹ thuật cốt lõi của dự án.

### 1. Quy trình Phát triển (Local Development)
Chế độ Local kết hợp sức mạnh của NodeJS (Hot-reload) và Docker (Cô lập Database).
1. Khởi động DB: `docker compose up -d launchpad-db launchpad-adminer`
2. Cài đặt thư viện: `yarn setup`
3. Khởi chạy Dev Server: `yarn dev` (Khởi động song song cả Next.js và Strapi).

👉 **[Xem Hướng dẫn Local Development Chi tiết (docs/LOCAL_DEV.md)](./docs/LOCAL_DEV.md)**

👉 **[Xem Hướng dẫn Nâng cấp Strapi (docs/UPGRADE_STRAPI.md)](./docs/UPGRADE_STRAPI.md)**

### 2. Quy trình Triển khai (Production Deployment)
Toàn bộ hướng dẫn triển khai hệ thống lên VPS (Bao gồm thiết lập Docker Registry, cấu hình Nginx Proxy, và quản lý SSL) đã được tách riêng thành một tài liệu chi tiết.

👉 **[Xem Hướng dẫn Triển khai VPS (DEPLOY.md)](./DEPLOY.md)**

### 3. Kiến trúc Mạng & Nginx Proxy
Để tiết kiệm tài nguyên và dễ quản lý nhiều tên miền trên cùng một VPS:
- Frontend và Backend giao tiếp kín qua mạng ảo Docker (`http://strapi:1337`).
- Hệ thống đẩy toàn bộ traffic ra ngoài qua một container **Nginx CMS ở cổng `8000`**.
- Bạn cần sử dụng hệ sinh thái **LaunchPad Registry Stack (Nginx UI)** để làm Proxy trỏ Tên miền (Domain) và cấp phát chứng chỉ HTTPS vào cổng `8000` này.

### 4. Giao tiếp API & Caching
- **Bảo mật API:** Next.js dùng `API Token` (Bearer) cấu hình trong `.env` để fetch dữ liệu riêng tư.
- **Next.js Caching:** Các API request đều được Next.js lưu cache. Khi sửa nội dung trên Strapi, Strapi sẽ tự động bắn Webhook để Next.js thực hiện lệnh `revalidate` làm mới giao diện ngay tức thì.

---

## 🌌 Hệ sinh thái LaunchPad

Dự án này là một phần của hệ sinh thái **LaunchPad** — Bộ giải pháp toàn diện cho các dự án khởi nghiệp và doanh nghiệp:

- 💻 [**LaunchPad CMS Fullstack**](https://github.com/tuquet/launchpad-cms-fullstack): Core Backend & Website.
- 📱 [**LaunchPad Mobile Native**](https://github.com/tuquet/launchpad-mobile-native): App React Native / Expo tích hợp sẵn với Strapi.
- 🐳 [**LaunchPad Registry Stack**](https://github.com/tuquet/launchpad-registry-stack): Hệ thống Private Docker Registry + Nginx UI để triển khai CI/CD tối ưu chi phí VPS.

⭐️ **Nếu bạn thấy hệ sinh thái này hữu ích, hãy ủng hộ bằng cách thả Star trên GitHub nhé!**
