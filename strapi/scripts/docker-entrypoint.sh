#!/bin/sh
set -e

# 1. Kiểm tra nếu người dùng bật biến môi trường SEED_DATA
if [ "$SEED_DATA" = "true" ]; then
  echo "🚀 [Init Container] Starting Data and Image Seed process..."

  # Tìm file nén seed mới nhất trong thư mục /opt/app/data
  SEED_FILE=$(ls -t /opt/app/data/export_*.tar.gz 2>/dev/null | head -n 1)

  if [ -n "$SEED_FILE" ]; then
    echo "📦 Found seed file: $SEED_FILE. Importing data and images..."
    # Dùng lệnh echo "y" để truyền thẳng câu trả lời 'Yes' vào prompt xóa dữ liệu nhằm tự động hóa hoàn toàn
    echo "y" | yarn strapi import -f "$SEED_FILE" --force || echo "⚠️ Cảnh báo: Gặp lỗi khi import (có thể do sai quyền thư mục uploads hoặc đã import trước đó)"
  else
    echo "⚠️ Bật SEED_DATA=true nhưng KHÔNG tìm thấy file .tar.gz nào ở data/"
  fi

  echo "✅ Init Container Seed process finished."
fi

# 2. Bắt đầu trả lại process chính để chạy ứng dụng (ở đây là lệnh yarn start)
# Lệnh exec "$@" đảm bảo Node.js sẽ bắt được tín hiệu SIGTERM khi tắt container
exec "$@"
