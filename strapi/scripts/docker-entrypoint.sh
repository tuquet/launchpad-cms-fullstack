#!/bin/sh
set -e

# Bắt đầu trả lại process chính để chạy ứng dụng (ở đây là lệnh yarn start)
# Lệnh exec "$@" đảm bảo Node.js sẽ bắt được tín hiệu SIGTERM khi tắt container
exec "$@"
