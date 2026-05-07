#!/bin/bash

echo "🚀 Bắt đầu cập nhật SBLT CUP..."

# Báo cho hệ thống biết dừng lại nếu có lỗi
set -e

# 1. Tải code mới nhất từ nhánh main trên GitHub
git pull origin main

# 2. Cài đặt thư viện từ lockfile (reproducible, không tự ý nâng version)
npm ci

# 3. Cập nhật Database (migrate deploy an toàn hơn db push cho production)
npx prisma generate
npx prisma db push --accept-data-loss

# 4. Build lại giao diện Next.js
npm run build

# 5. Khởi động lại PM2 để áp dụng thay đổi
pm2 restart sblt-cup

# 6. Health check — đợi app khởi động xong
echo "⏳ Đợi app khởi động..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Đã cập nhật và lên sóng thành công! (HTTP $HTTP_STATUS)"
else
  echo "❌ Health check thất bại! HTTP $HTTP_STATUS — kiểm tra logs: pm2 logs sblt-cup"
  exit 1
fi
