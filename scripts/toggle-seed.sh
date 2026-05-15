#!/bin/bash

# Script: toggle-seed.sh
# Mục đích: Thay đổi SEED_DATA=true/false mà KHÔNG cần cài Node.js (dùng cho VPS)

ACTION=$1

if [ "$ACTION" != "enable" ] && [ "$ACTION" != "disable" ]; then
  echo "❌ Lỗi: Vui lòng truyền tham số 'enable' hoặc 'disable'."
  echo "VD: ./toggle-seed.sh enable"
  exit 1
fi

if [ "$ACTION" = "enable" ]; then
  TARGET="SEED_DATA=true"
  REPLACE="SEED_DATA=false"
else
  TARGET="SEED_DATA=false"
  REPLACE="SEED_DATA=true"
fi

FILES=(".env" "next/.env" "strapi/.env")

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    if grep -q "$REPLACE" "$FILE"; then
      # Sử dụng sed để thay thế chuỗi
      # Tương thích với cả GNU sed (Linux) và BSD sed (macOS)
      sed -i.bak "s/$REPLACE/$TARGET/g" "$FILE"
      rm -f "${FILE}.bak"
      echo "✅ Đã chuyển đổi thành $TARGET tại $FILE"
    elif grep -q "$TARGET" "$FILE"; then
      echo "ℹ️ File $FILE đã được thiết lập là $TARGET từ trước."
    else
      echo "ℹ️ Không tìm thấy biến SEED_DATA tại $FILE"
    fi
  else
    echo "⚠️ Không tìm thấy file $FILE"
  fi
done
