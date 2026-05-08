#!/bin/bash

echo "🚀 Bắt đầu cập nhật SBLT CUP..."

# Dừng lại ngay nếu có lỗi
set -e

# Kiểm tra env vars quan trọng
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL chưa được thiết lập!"
  exit 1
fi

# Safety check: Verify we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Chỉ có thể deploy từ nhánh main! Hiện tại đang trên: $CURRENT_BRANCH"
  exit 1
fi

# 1. Tải code mới nhất từ nhánh main
echo "📥 Tải code từ GitHub..."
git pull origin main

# 2. Cài đặt thư viện từ lockfile
echo "📦 Cài đặt dependencies..."
npm ci

# 3. Cập nhật Database (migrate deploy an toàn cho production)
echo "🗄️ Cập nhật database..."
npx prisma generate
npx prisma migrate deploy

# 4. Build lại Next.js
echo "🔨 Build Next.js..."
npm run build

# 5. Khởi động lại PM2
echo "🔄 Khởi động lại ứng dụng..."
pm2 restart sblt-cup

# 6. Health check
echo "⏳ Đợi app khởi động..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Đã cập nhật và lên sóng thành công! (HTTP $HTTP_STATUS)"
else
  echo "❌ Health check thất bại! HTTP $HTTP_STATUS — kiểm tra logs: pm2 logs sblt-cup"
  exit 1
fi
