# 🚀 Hướng dẫn Triển khai VPS (Zero-Build Workflow)

Quy trình này giúp bạn triển khai bộ **Strapi + Next.js** lên VPS cấu hình thấp (1GB-2GB RAM) mà không lo bị treo máy do build.

## 🏗️ Kiến trúc Triển khai

1.  **Máy Local:** Build Docker images và Push lên Registry.
2.  **Private Registry:** Lưu trữ images an toàn.
3.  **VPS Production:** Chỉ cần `pull` và `run`.

---

## 📦 Bước 1: Chuẩn bị tại Local

Đảm bảo bạn đã có [LaunchPad Registry Stack](https://github.com/tuquet/launchpad-registry-stack) đang chạy.

### 1.1 Đăng nhập vào Registry
Mở terminal tại thư mục này và chạy:
```bash
# Sử dụng VS Code Task: "🔑 registry: login" 
# Hoặc chạy lệnh:
docker login <REGISTRY_IP>:5000
```

### 1.2 Build và Push Images
Sử dụng bộ VS Code Tasks đã được cấu hình sẵn:
1. Nhấn `Ctrl + Shift + B`.
2. Chọn `🐳 registry: push-all`.
3. Nhập Registry IP (vd: `1.2.3.4:5000`) và Tag (vd: `v1`).

---

## 🚀 Bước 2: Triển khai trên VPS

### 2.1 Copy các file cần thiết
Bạn chỉ cần copy các file sau lên VPS:
- `docker-compose.prod.yml`
- `.env` (Cấu hình các biến môi trường cho Production)
- Thư mục `nginx/` (Để cấu hình reverse proxy và SSL)

### 2.2 Cấu hình `.env` trên VPS
Đảm bảo các biến sau chính xác:
```env
REGISTRY_URL=localhost:5000  # Đổi thành IP registry nếu chạy remote
IMAGE_TAG=v1                 # Tag bạn đã push ở bước 1.2
NEXT_PUBLIC_API_URL=http://your-domain.com
```

### 2.3 Chạy hệ thống
Tại thư mục chứa file trên VPS:
```bash
# Đăng nhập vào registry trên VPS
docker login <REGISTRY_IP>:5000

# Pull và khởi chạy
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 🔄 Cập nhật phiên bản mới

Khi có code mới, bạn chỉ cần lặp lại quy trình:
1. **Local:** Build & Push với Tag mới (vd: `v2`).
2. **VPS:** Sửa `IMAGE_TAG=v2` trong `.env`.
3. **VPS:** Chạy `docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d`.

---

## 💡 Mẹo nhỏ
- Luôn sử dụng `IMAGE_TAG` cụ thể thay vì `latest` để dễ dàng rollback khi có lỗi.
- Đảm bảo VPS đã mở các port cần thiết (`80`, `443`).
