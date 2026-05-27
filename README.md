# SBLT CUP - TFT Tournament Management System

A production-ready tournament management platform for TFT (Teamfight Tactics) built with Next.js 16, TypeScript, Prisma 7, and NextAuth.

## Features

- Tournament creation, registration, and management
- Prediction/forecasting system with leaderboard
- Real-time updates via SSE (Server-Sent Events)
- Role-based access (Admin / Player)
- Push notifications (Web Push API)
- Player rating system (composite 0-1000 score based on match history)
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

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Duck-SFIT-CNTT2-K64/SBLT_CUP.git
cd SBLT_CUP

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 4. Set up database
createdb sblt_cup              # Create PostgreSQL database
npm run db:generate            # Generate Prisma client
npm run db:push                # Push schema to database
npm run db:seed                # Seed with demo data

# 5. Start development server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+ — [Install guide](https://www.postgresql.org/download/)
- **Redis** (optional) — for persistent rate limiting across PM2 instances. Falls back to in-memory if not available.

### Installing PostgreSQL

**macOS** (Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian**:
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

After installation, create the database:
```bash
createdb sblt_cup
# Or via psql:
# psql -c "CREATE DATABASE sblt_cup;"
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:pass@localhost:5432/sblt_cup`) |
| `NEXTAUTH_SECRET` | Auth secret (min 32 chars). Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000` for dev) |
| `ADMIN_EMAILS` | Comma-separated admin email addresses |

### Optional

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID for social login + auto avatar |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `REDIS_URL` | Redis URL for rate limiting (e.g. `redis://localhost:6379`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Email notifications via SMTP |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Push notifications (generate with `npx web-push generate-vapid-keys`) |
| `SENTRY_DSN` | Sentry DSN for error monitoring |
| `WEBHOOK_SECRET` | Webhook secret for Google Forms integration (generate: `openssl rand -hex 32`) |

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
4. Copy the Client ID and Secret to your `.env`

### Generating VAPID Keys (Push Notifications)

```bash
npx web-push generate-vapid-keys
```

Copy the generated public and private keys to `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in `.env`.

## Database

### Schema

The database schema is defined in `prisma/schema.prisma`. Key models:

- `User` / `Player` — user accounts and player profiles
- `Tournament` / `Stage` / `Group` — tournament structure
- `Game` / `GameResult` — match results
- `Prediction` / `PredictionEntry` — user predictions
- `AuditLog` — admin action logging

### Seed Data

The seed script (`prisma/seed.ts`) creates a demo tournament with:
- Admin and player user accounts
- A tournament with qualifier, semi-final, and final stages
- Sample game results for testing

### Common Database Commands

```bash
npm run db:generate    # Regenerate Prisma client after schema changes
npm run db:push        # Push schema changes to database (dev only)
npm run db:seed        # Reset and seed database
npx prisma studio      # Open Prisma Studio (database GUI)
npx prisma migrate dev # Create a migration (for production)
```

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
    predictions/    # Prediction pages and leaderboard
  components/       # React components
  lib/              # Shared utilities
    prisma.ts       # Prisma client singleton
    auth.ts         # NextAuth configuration
    rating.ts       # Player composite rating calculation
    predictions.ts  # Prediction window and scoring logic
    rate-limit.ts   # Redis rate limiter with fallback
    audit.ts        # Audit logging for admin actions
  __tests__/        # Test suites
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

MIT
