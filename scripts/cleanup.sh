#!/bin/bash

# =============================================================================
# LaunchPad DevOps - One-Click System Cleanup Script
# Mục tiêu: Giải phóng dung lượng ổ cứng bị chiếm bởi Docker và Logs hệ thống.
# =============================================================================

echo "🚀 Bắt đầu dọn dẹp hệ thống..."

# 1. Dọn dẹp Docker
echo "🧹 Đang dọn dẹp Docker (Images, Containers, Cache)..."
docker system prune -af
docker builder prune -af

# 2. Dọn dẹp Logs hệ thống (chỉ giữ lại logs trong 1 ngày gần nhất)
echo "📜 Đang thu dọn System Logs (journalctl)..."
if command -v journalctl >/dev/null; then
    sudo journalctl --vacuum-time=1d
fi

# 3. Dọn dẹp cache của trình quản lý gói (apt)
echo "📦 Đang xóa cache apt-get..."
if command -v apt-get >/dev/null; then
    sudo apt-get clean
fi

# 4. Kiểm tra dung lượng sau khi dọn dẹp
echo "======================================================"
echo "✅ Dọn dẹp hoàn tất!"
echo "📊 Dung lượng ổ cứng hiện tại:"
df -h | grep '^/dev/'
echo "======================================================"
