#!/bin/bash

echo "🚀 Bắt đầu cập nhật SBLT CUP..."

# Dừng lại ngay nếu có lỗi
set -e

# Configurable via environment variables with defaults
DEPLOY_PATH=${DEPLOY_PATH:-$(pwd)}
PM2_APP_NAME=${PM2_APP_NAME:-sblt-cup}
HEALTH_CHECK_URL=${HEALTH_CHECK_URL:-http://localhost:3000/api/health}

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

# Navigate to deploy path
cd "$DEPLOY_PATH"

# Save current commit for rollback
ROLLBACK_COMMIT=$(git rev-parse HEAD)
echo "📌 Commit hiện tại: ${ROLLBACK_COMMIT:0:7}"

# Rollback function
rollback() {
  echo ""
  echo "⚠️  Deploy thất bại! Đang rollback về ${ROLLBACK_COMMIT:0:7}..."
  git reset --hard "$ROLLBACK_COMMIT"
  npm ci
  npm run build
  pm2 restart "$PM2_APP_NAME"
  echo "✅ Đã rollback thành công. Ứng dụng đang chạy version cũ."
  exit 1
}

# Trap errors to trigger rollback
trap rollback ERR

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
echo "🔄 Khởi động lại ứng dụng ($PM2_APP_NAME)..."
pm2 restart "$PM2_APP_NAME"

# 6. Health check
echo "⏳ Đợi app khởi động..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
  # Disable trap — deploy succeeded
  trap - ERR
  echo "✅ Đã cập nhật và lên sóng thành công! (HTTP $HTTP_STATUS)"
else
  echo "❌ Health check thất bại! HTTP $HTTP_STATUS"
  rollback
fi
