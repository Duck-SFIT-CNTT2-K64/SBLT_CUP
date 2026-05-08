#!/bin/bash

echo "🚀 Bắt đầu cập nhật SBLT CUP..."

# Dừng lại ngay nếu có lỗi
set -e

# Kiểm tra env vars quan trọng
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL chưa được thiết lập!"
  exit 1
fi

# 1. Tải code mới nhất từ nhánh main
git pull origin main

# 2. Cài đặt thư viện từ lockfile
npm ci

# 3. Cập nhật Database (migrate deploy an toàn cho production)
npx prisma generate
npx prisma migrate deploy

# 4. Build lại Next.js
npm run build

# 5. Khởi động lại PM2
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
