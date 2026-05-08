# SBLT CUP - TFT Tournament Management System

A production-ready tournament management platform for TFT (Teamfight Tactics) built with Next.js 16, TypeScript, Prisma 7, and NextAuth.

## Features

- Tournament creation, registration, and management
- Prediction/forecasting system with leaderboard
- Real-time updates via SSE (Server-Sent Events)
- Role-based access (Admin / Player)
- Push notifications (Web Push API)
- Dispute resolution system
- Audit logging for admin actions

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma 7 ORM
- **Auth**: NextAuth v5 (beta)
- **Styling**: Tailwind CSS 4
- **Testing**: Jest + Playwright (E2E)
- **Monitoring**: Sentry
- **Caching/Rate Limiting**: Redis (with in-memory fallback)

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (optional, for persistent rate limiting)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd sblt-cup

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Set up database
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed with initial data

# Start development server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Auth secret (min 32 chars). Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `ADMIN_EMAILS` | Yes | Comma-separated admin email addresses |
| `NODE_ENV` | No | `development`, `production`, or `test` (default: `development`) |
| `REDIS_URL` | No | Redis URL for persistent rate limiting (falls back to in-memory) |
| `SMTP_HOST` | No | SMTP server for email notifications |
| `SMTP_PORT` | No | SMTP port (default: `587`) |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | VAPID public key for push notifications |
| `VAPID_PRIVATE_KEY` | No | VAPID private key for push notifications |
| `VAPID_SUBJECT` | No | VAPID subject (e.g. `mailto:admin@domain.com`) |
| `SENTRY_DSN` | No | Sentry DSN for error monitoring |

## Running Tests

```bash
# Run all unit + component tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests (requires running app)
npx playwright test
```

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
    api/            # API route handlers
    admin/          # Admin dashboard pages
    dashboard/      # Player dashboard pages
    tournaments/    # Tournament pages
  components/       # React components
  lib/              # Shared utilities
    prisma.ts       # Prisma client singleton
    auth.ts         # NextAuth configuration
    env.ts          # Environment variable validation
    rate-limit.ts   # Redis rate limiter with fallback
    logger.ts       # Structured logging with Sentry
    audit.ts        # Audit logging for admin actions
  __tests__/        # Test suites
    api/            # API route tests
    components/     # Component tests
    e2e/            # Playwright E2E tests
    integration/    # Integration tests
    lib/            # Library unit tests
prisma/
  schema.prisma     # Database schema
  seed.ts           # Database seed script
```

## Deployment

### Production Deploy

```bash
# Set environment variables (see .env.example)
export DATABASE_URL="postgresql://..."
export NEXTAUTH_SECRET="..."
export NEXTAUTH_URL="https://your-domain.com"
export ADMIN_EMAILS="admin@your-domain.com"

# Run deploy script
bash deploy.sh
```

The deploy script:
1. Verifies you're on the `main` branch
2. Pulls latest code
3. Installs dependencies from lockfile
4. Runs database migrations
5. Builds Next.js
6. Restarts the app via PM2
7. Runs health check

### Configuration via Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `DEPLOY_PATH` | `$(pwd)` | Directory to deploy from |
| `PM2_APP_NAME` | `sblt-cup` | PM2 process name |
| `HEALTH_CHECK_URL` | `http://localhost:3000/api/health` | Health check endpoint |

### Health Check

```bash
curl http://localhost:3000/api/health
```

Returns:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok", "latencyMs": 5 },
    "schema": { "status": "ok", "tables": ["Prediction", "PredictionEntry"] }
  },
  "timestamp": 1715000000000
}
```

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`):
- Runs tests on every push to `main`
- Builds the application
- Deploys only if tests and build pass

## License

Private - SBLT CUP
