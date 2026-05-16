#!/bin/bash

# =============================================================================
# LaunchPad CMS - One-Click Demo Installer
# Mục tiêu: Tự động hóa 100% quá trình cài đặt và trải nghiệm hệ thống.
# =============================================================================

echo "================================================================="
echo "🚀 CHÀO MỪNG BẠN ĐẾN VỚI LAUNCHPAD CMS - B2B ENTERPRISE"
echo "================================================================="
echo ""
echo "⚠️ Yêu cầu hệ thống trước khi bắt đầu:"
echo "   - Đã cài đặt Docker và Docker Compose."
echo "   - Ứng dụng Docker (Docker Desktop/Engine) ĐANG CHẠY."
echo "   - Máy tính còn trống ít nhất 3GB dung lượng ổ cứng."
echo ""
read -p "👉 Bạn đã sẵn sàng chưa? (Nhấn Enter để tiếp tục hoặc Ctrl+C để hủy) "

# 1. Kiểm tra Docker có đang chạy không
echo ""
echo "🔍 [1/4] Đang kiểm tra hệ thống Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Lỗi: Không tìm thấy lệnh 'docker'. Vui lòng cài đặt Docker trước!"
    exit 1
fi
if ! docker info > /dev/null 2>&1; then
    echo "❌ Lỗi: Docker chưa được bật. Vui lòng mở Docker Desktop lên nhé!"
    exit 1
fi
echo "✅ Docker đã sẵn sàng!"

# 2. Sinh biến môi trường
echo ""
echo "🔧 [2/4] Đang khởi tạo file cấu hình môi trường (.env)..."
bash scripts/copy-env.sh --env dev

# 3. Chạy Docker Compose
echo ""
echo "🐳 [3/4] Đang tiến hành Build và Tải hệ thống..."
echo "⏳ Quá trình này sẽ mất khoảng 2-5 phút (Tùy tốc độ mạng). Vui lòng không tắt cửa sổ này!"
docker compose up -d --build

# Kiểm tra nếu lệnh chạy thất bại
if [ $? -ne 0 ]; then
    echo "❌ Lỗi: Quá trình Build Docker gặp sự cố. Vui lòng kiểm tra log ở trên."
    exit 1
fi

# 4. Nạp dữ liệu mẫu
echo ""
echo "📦 [4/4] Đang nạp dữ liệu mẫu (Bài viết, Cấu hình SEO...)"
echo "⏳ Chờ 10 giây để Database khởi động hoàn tất trước khi bơm dữ liệu..."
sleep 10
docker compose exec strapi sh -c 'echo "y" | yarn strapi import -f ./data/export_20250116105447.tar.gz --force'

echo ""
echo "================================================================="
echo "🎉 CÀI ĐẶT THÀNH CÔNG! HỆ THỐNG ĐÃ SẴN SÀNG"
echo "================================================================="
echo "Dưới đây là các đường dẫn để bạn trải nghiệm:"
echo ""
echo "🌐 Website (Next.js)      : http://localhost:3000"
echo "🛠️ Quản trị CMS (Strapi)   : http://localhost:1337/admin"
echo "🗄️ Quản trị DB (Adminer)   : http://localhost:8080"
echo "📖 Tài liệu API (Swagger) : http://localhost:1337/documentation/v1.0.0"
echo ""
echo "💡 Mẹo: Tài khoản đăng nhập CMS là tài khoản bạn tạo trong lần truy cập đầu tiên."
echo "================================================================="
