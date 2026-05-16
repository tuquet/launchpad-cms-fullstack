#!/bin/bash

# =============================================================================
# LaunchPad DevOps - Reset Repository Script
# Mục tiêu: Đưa dự án về trạng thái "sạch sẽ" như lúc mới clone code về.
# Đặc biệt: GIỮ LẠI node_modules để không phải tải lại từ đầu gây tốn thời gian.
# =============================================================================

echo "🔄 Bắt đầu Reset Repository..."

# 1. Tắt Docker và xóa toàn bộ Volumes (Database cũ)
echo "🛑 Đang tắt Docker và dọn dẹp Database cũ..."
docker compose down -v 2>/dev/null

# 2. Xóa các file .env
echo "🗑️ Đang xóa các file cấu hình (.env)..."
rm -f .env
rm -f strapi/.env
rm -f next/.env

# 3. Dọn dẹp Build Cache của Next.js và Strapi
echo "🧹 Đang dọn dẹp bộ nhớ đệm (Build cache)..."
rm -rf next/.next
rm -rf strapi/build
rm -rf strapi/.cache

echo "======================================================"
echo "✅ Reset thành công! Dự án đã hoàn toàn sạch sẽ."
echo "📦 (Thư mục node_modules vẫn được giữ nguyên để tiết kiệm thời gian)"
echo ""
echo "👉 Để bắt đầu lại trải nghiệm, hãy chạy:"
echo "   bash scripts/copy-env.sh --env dev"
echo "   docker compose up -d --build"
echo "======================================================"
