#!/bin/bash

echo "🧪 Deploying to STAGING environment..."

set -e

# Configurable via environment variables with defaults
DEPLOY_PATH=${DEPLOY_PATH:-$(pwd)}
PM2_APP_NAME=${PM2_APP_NAME:-sblt-cup-staging}
HEALTH_CHECK_URL=${HEALTH_CHECK_URL:-http://localhost:3001/api/health}
STAGING_PORT=${STAGING_PORT:-3001}

# Load staging env
if [ -f .env.staging ]; then
  set -a
  source .env.staging
  set +a
fi

# Safety check: Verify we're on main or staging branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "staging" ]; then
  echo "❌ Chỉ có thể deploy staging từ nhánh main hoặc staging! Hiện tại: $CURRENT_BRANCH"
  exit 1
fi

cd "$DEPLOY_PATH"

# Save current commit for rollback
ROLLBACK_COMMIT=$(git rev-parse HEAD)
echo "📌 Commit hiện tại: ${ROLLBACK_COMMIT:0:7}"

rollback() {
  echo ""
  echo "⚠️  Staging deploy thất bại! Đang rollback..."
  git reset --hard "$ROLLBACK_COMMIT"
  npm ci
  npm run build
  pm2 restart "$PM2_APP_NAME"
  echo "✅ Đã rollback thành công."
  exit 1
}

trap rollback ERR

echo "📥 Tải code từ GitHub..."
git pull origin "$CURRENT_BRANCH"

echo "📦 Cài đặt dependencies..."
npm ci

echo "🗄️ Cập nhật database (staging)..."
npx prisma generate
npx prisma migrate deploy

echo "🔨 Build Next.js..."
npm run build

echo "🔄 Khởi động lại staging app ($PM2_APP_NAME)..."
pm2 restart "$PM2_APP_NAME" || pm2 start npm --name "$PM2_APP_NAME" -- start -- -p "$STAGING_PORT"

echo "⏳ Đợi app khởi động..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
  trap - ERR
  echo "✅ Staging deploy thành công! (HTTP $HTTP_STATUS)"
  echo "🌐 Staging URL: http://localhost:$STAGING_PORT"
else
  echo "❌ Health check thất bại! HTTP $HTTP_STATUS"
  rollback
fi
