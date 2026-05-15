#!/bin/bash

# Script: copy-env.sh
# Mục đích: Copy .env.example sang .env và tự động tạo ngẫu nhiên các khóa bảo mật (Dùng cho VPS)

FORCE=0
PATHS=()

for arg in "$@"; do
  if [ "$arg" = "--force" ] || [ "$arg" = "-f" ]; then
    FORCE=1
  else
    PATHS+=("$arg")
  fi
done

if [ ${#PATHS[@]} -eq 0 ]; then
  PATHS=(".")
fi

for TARGET_DIR in "${PATHS[@]}"; do
  echo ""
  
  # Xử lý lấy tên thư mục an toàn
  if [ "$TARGET_DIR" = "." ]; then
    DIR_NAME="Root"
  else
    DIR_NAME=$(basename "$TARGET_DIR")
  fi
  
  echo "--- 📂 Processing Environment: $DIR_NAME ---"
  
  EXAMPLE_PATH="$TARGET_DIR/.env.example"
  ENV_PATH="$TARGET_DIR/.env"
  
  if [ ! -f "$EXAMPLE_PATH" ]; then
    echo "  ❌ [Error] .env.example not found at: $EXAMPLE_PATH"
    continue
  fi
  
  if [ -f "$ENV_PATH" ] && [ $FORCE -eq 0 ]; then
    echo "  ⏩ [Skip] .env already exists. Use --force to overwrite."
    continue
  fi
  
  # Copy example to env
  cp "$EXAMPLE_PATH" "$ENV_PATH"
  
  # Cố gắng sử dụng Perl để thay thế từng placeholder bằng một chuỗi ngẫu nhiên độc lập
  if command -v perl &> /dev/null; then
    perl -pi -e 's/tobemodified[a-zA-Z0-9_]*/qx(openssl rand -base64 32 | tr -d "\n")/gie' "$ENV_PATH"
  else
    # Fallback: Nếu VPS không có perl, dùng sed để thay thế (cùng 1 chuỗi cho tất cả)
    echo "  ⚠️ [Warning] Perl is not installed. Using basic sed replacement (same secret for all)."
    SECRET=$(openssl rand -base64 32 | tr -d '\n' | sed 's/[\/&]/\\&/g')
    # Tương thích với macOS (BSD sed) và Linux (GNU sed)
    sed -i.bak "s/tobemodified[a-zA-Z0-9_]*/$SECRET/gi" "$ENV_PATH"
    rm -f "$ENV_PATH.bak"
  fi
  
  echo "  ✅ [Success] Created .env with fresh random secrets at $ENV_PATH"
done
