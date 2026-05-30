# Master Project Context — SBLT CUP

> Tài liệu ngữ cảnh tổng thể cho dự án SBLT CUP. Được tạo để cung cấp cho AI hoặc dự án khác hiểu ngay lập tức toàn bộ nền tảng kỹ thuật và nghiệp vụ.

---

## 1. Tổng quan Dự án (Project Overview)

**SBLT CUP** là nền tảng quản lý giải đấu TFT (Teamfight Tactics) dành cho cộng đồng Việt Nam. Trang web hỗ trợ toàn bộ vòng đời giải đấu: từ đăng ký, bốc thăm, nhập kết quả, đến bảng xếp hạng và dự đoán.

### Đối tượng sử dụng
- **Người chơi (Player):** Đăng ký tham gia, xem lịch thi, theo dõi kết quả, dự đoán, khiếu nại
- **Admin:** Quản lý giải đấu, tạo vòng đấu, nhập kết quả, xử lý khiếu nại, xem audit log
- **Khách (Guest):** Xem giải đấu, bảng xếp hạng, thông báo (không cần đăng nhập)

### Tính năng chính
| Tính năng | Mô tả |
|---|---|
| Quản lý giải đấu | CRUD tournament, multi-stage (Qualifier → Semi 1 → Semi 2 → Final), warmup exhibition |
| Đăng ký & Check-in | Player đăng ký, admin approve/reject, check-in trước thi đấu |
| Bốc thăm (Ball Draw) | Animated spinning wheel chia bảng đấu |
| Nhập kết quả | Admin nhập placement 1-8 per game, auto tính điểm |
| Bảng xếp hạng | Real-time standings, leaderboard toàn giải, per-stage |
| Dự đoán (Predictions) | Predict top 4 per group, window-based (09:00-19:30 VN), auto-scoring |
| Đua vịt Tie-breaker | Duck race animation khi nhiều người cùng điểm dự đoán |
| Thông báo | Multi-channel: in-app, email (SMTP), web push (VAPID) |
| Real-time (SSE) | Server-Sent Events cho live updates: kết quả, bracket, standings |
| Khiếu nại | Player gửi dispute với ảnh đính kèm, admin review/resolve |
| Bình luận & Reaction | Threaded comments, emoji reactions (Like, Fire, Trophy, Clap) |
| Chat toàn cầu | Floating global chat panel, SSE-connected |
| PWA | Service worker, manifest, installable on mobile |
| SEO | JSON-LD, OpenGraph, dynamic sitemap, robots.txt |
| Analytics | Player stats, tournament analytics, admin dashboard charts |
| Lockdown | Site lockdown during livestream với IP whitelisting |

---

## 2. Tech Stack & Dependencies

### Core
| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16.2.6 |
| Language | TypeScript | ^5 |
| UI Library | React | 19.2.4 |
| Database | PostgreSQL | 16 |
| ORM | Prisma | ~7.8.0 |
| Auth | NextAuth.js v5 | ~5.0.0-beta.31 |
| Cache/Pub-Sub | Redis (ioredis) | ^5.10.1 |
| Styling | Tailwind CSS v4 | ^4 |
| Monitoring | Sentry | ~10.52.0 |

### Key Dependencies
| Package | Purpose |
|---|---|
| `@prisma/adapter-pg` | Prisma driver adapter cho PostgreSQL |
| `@auth/prisma-adapter` | NextAuth Prisma adapter |
| `bcryptjs` | Password hashing |
| `zod` | Runtime validation |
| `sharp` | Image processing (avatar, evidence) |
| `nodemailer` | Email notifications |
| `web-push` | Web Push notifications |
| `framer-motion` | UI animations (BallDraw, GuestCard, LandingIntro) |
| `recharts` | Admin analytics charts |
| `class-variance-authority` | Component variant system |
| `clsx` + `tailwind-merge` | Conditional classnames |
| `lucide-react` | Icon library |

### Dev Dependencies
| Package | Purpose |
|---|---|
| Jest + ts-jest | Unit testing |
| Playwright | E2E testing |
| Testing Library | React component testing |
| ESLint 9 | Linting |

### Deployment
| Component | Technology |
|---|---|
| Process Manager | PM2 (cluster mode, 2 instances) |
| Reverse Proxy | Cloudflare (DNS + proxy + WAF) |
| Server | Self-hosted (sbltcup.dev) |
| CI/CD | GitHub Actions (self-hosted runner) |

---

## 3. Kiến trúc & Cấu trúc thư mục

### Mô hình kiến trúc
**Monolithic Next.js App** với App Router. Không phải microservices — tất cả trong một codebase, deploy trên một server.

```
Request Flow:
Client → Cloudflare → PM2 (2 instances) → Next.js App Router
                                              ├── proxy.ts (middleware: lockdown, CSRF, rate-limit, auth)
                                              ├── app/page.tsx (Server Components)
                                              ├── app/api/*/route.ts (API Routes)
                                              └── lib/* (shared logic)
```

### Cấu trúc thư mục chính

```
SBLT_CUP/
├── prisma/
│   ├── schema.prisma          # 18 models, 10 enums
│   ├── seed.ts                # Seed data (1 admin, 16 guests, 48 players, 2 tournaments)
│   ├── migrations/            # 2 migrations (init + notification tables)
│   └── config.ts              # PrismaPg adapter config
│
├── src/
│   ├── proxy.ts               # Middleware: lockdown, CSRF, rate-limit, auth gate
│   │
│   ├── app/
│   │   ├── layout.tsx         # Root layout (Inter+Oswald fonts, Navbar, Footer, SSE)
│   │   ├── page.tsx           # Homepage (hero, stats, format, guests, rules)
│   │   ├── globals.css        # "Kinetic Noir" design system (Tailwind v4 @theme)
│   │   │
│   │   ├── auth/              # Login, Register, Forgot/Reset Password
│   │   ├── tournaments/       # Public tournament pages
│   │   │   └── [id]/
│   │   │       ├── page.tsx           # Tournament detail
│   │   │       ├── brackets/          # Group standings
│   │   │       ├── predictions/       # Prediction form + leaderboard
│   │   │       ├── results/           # Game results
│   │   │       ├── standings/         # Cumulative rankings
│   │   │       └── warmup/            # Warmup exhibition page
│   │   │
│   │   ├── dashboard/         # Authenticated user pages
│   │   │   ├── profile/       # Edit IGN, rank, avatar
│   │   │   ├── notifications/ # Notification preferences
│   │   │   ├── predictions/   # Prediction history
│   │   │   ├── schedule/      # Personal match schedule
│   │   │   ├── results/       # Personal results
│   │   │   └── disputes/      # Dispute management
│   │   │
│   │   ├── admin/             # Admin panel (guarded by AdminGuard)
│   │   │   ├── tournaments/   # CRUD, stages, groups, games, draw, prizes
│   │   │   ├── users/         # User management
│   │   │   ├── players/       # Registration management
│   │   │   ├── announcements/ # Announcement CRUD
│   │   │   ├── disputes/      # Dispute resolution
│   │   │   └── audit-logs/    # Audit trail viewer
│   │   │
│   │   ├── api/               # 63 API route files
│   │   │   ├── auth/          # NextAuth catch-all + register + password reset
│   │   │   ├── tournaments/   # Tournament CRUD, stages, groups, games, predictions, prizes
│   │   │   ├── admin/         # Admin-only endpoints
│   │   │   ├── sse/           # Server-Sent Events (global + per-tournament)
│   │   │   ├── notifications/ # CRUD + push + preferences
│   │   │   ├── leaderboard/   # Global leaderboard
│   │   │   ├── players/       # Profile, results, schedule
│   │   │   ├── chat/          # Global chat
│   │   │   ├── comments/      # Threaded comments
│   │   │   ├── reactions/     # Emoji reactions
│   │   │   ├── disputes/      # Dispute CRUD
│   │   │   ├── announcements/ # Announcement CRUD
│   │   │   ├── upload/        # Avatar + evidence upload
│   │   │   └── webhooks/      # Google Forms webhook
│   │   │
│   │   └── leaderboard/       # Global leaderboard page
│   │   └── predictions/       # Global prediction leaderboard
│   │   └── announcements/     # Public announcements
│   │   └── rules/             # Tournament rules
│   │   └── analytics/         # Player/tournament analytics
│   │   └── api-docs/          # Swagger API docs
│   │
│   ├── components/
│   │   ├── ui/                # Primitives: Button, Card, Badge, Avatar, Alert, DataTable, etc.
│   │   ├── layout/            # Navbar, Footer, Providers, AnnouncementPopup, LandingIntro
│   │   ├── tft/               # TournamentCard, GuestCard, PlayerProfileCard, DuckRace
│   │   ├── predictions/       # PredictionGroupForm, PredictionScoreCard, PredictionRulesAndRewards
│   │   ├── social/            # CommentSection, ReactionBar, ShareButton, GlobalChatPanel
│   │   ├── notifications/     # NotificationBell, NotificationPanel
│   │   ├── leaderboard/       # TopWinners (podium)
│   │   ├── admin/             # AdminGuard, AdminSidebar, AnalyticsCharts
│   │   └── BallDraw.tsx       # Animated spinning wheel for group draw
│   │
│   ├── lib/
│   │   ├── auth.ts            # NextAuth v5 config (Google OAuth + Credentials)
│   │   ├── prisma.ts          # Singleton PrismaClient with PrismaPg adapter
│   │   ├── redis.ts           # Lazy singleton ioredis client
│   │   ├── cache.ts           # Redis cache with stampede protection (3 TTL tiers)
│   │   ├── cache-invalidate.ts # Cache invalidation helpers
│   │   ├── sse.ts             # SSEManager singleton (5000 clients max, heartbeat, pub/sub)
│   │   ├── sse-pubsub.ts      # Redis pub/sub for cross-instance SSE
│   │   ├── constants.ts       # Domain constants (scoring, prizes, guests, format, prediction window)
│   │   ├── predictions.ts     # Prediction window logic, scoring engine
│   │   ├── notifications.ts   # Multi-channel notification system
│   │   ├── rate-limit.ts      # Redis-backed rate limiter
│   │   ├── validations.ts     # Zod schemas for all entities
│   │   ├── api-error.ts       # Error handling with Prisma error mapping
│   │   ├── audit.ts           # Audit log writer
│   │   ├── tournament-resolve.ts # Slug/ID resolution, Vietnamese slug generation
│   │   ├── image.ts           # Sharp image processing
│   │   ├── upload.ts          # File upload handler
│   │   ├── push.ts            # Web Push sender
│   │   ├── logger.ts          # Structured logger with Sentry
│   │   ├── logging.ts         # In-memory request logging
│   │   ├── env.ts             # Zod-validated env schema
│   │   ├── utils.ts           # cn(), formatCurrency, formatDate, etc.
│   │   └── hooks/
│   │       ├── useSSE.ts              # Client SSE hook with auto-reconnect
│   │       └── usePushNotifications.ts # Web Push subscription hook
│   │
│   └── types/
│       ├── index.ts           # Shared TypeScript types
│       └── next-auth.d.ts     # NextAuth type augmentation
│
├── public/
│   ├── logo.png, og-image.png, developer-avatar.png
│   ├── manifest.json, sw.js   # PWA
│   ├── icons/                 # PWA icons
│   ├── guests/                # Celebrity guest images (PNG + WebP)
│   └── uploads/               # User uploads (avatars, disputes)
│
├── ecosystem.config.js        # PM2 config (2 instances cluster + 1 worker)
├── deploy.sh                  # Production deploy script
├── deploy-staging.sh          # Staging deploy script
├── .github/workflows/         # CI (lint+test+build) + Deploy (self-hosted runner)
└── .lockdown                  # Runtime lockdown config (IP whitelist)
```

---

## 4. Luồng dữ liệu & Logic cốt lõi

### 4.1 Tournament Lifecycle

```
Admin tạo Tournament
  → status: UPCOMING
  → Tạo Stages (QUALIFIER → SEMI_1 → SEMI_2 → FINAL)
  → Mở Registration → status: REGISTRATION_OPEN
  → Đóng Registration → status: REGISTRATION_CLOSED
  → Bốc thăm (Ball Draw) → chia players vào Groups
  → Set Stage IN_PROGRESS → bắt đầu thi đấu
  → Admin nhập Game Results (placement 1-8)
  → Auto tính điểm (SCORING: 1st=8pts, 8th=1pt)
  → Advance players (top N per group → next stage)
  → Stage COMPLETED → auto score predictions
  → Lặp cho đến FINAL
  → Tournament COMPLETED
```

### 4.2 Scoring System

```
Placement → Points: {1:8, 2:7, 3:6, 4:5, 5:4, 6:3, 7:2, 8:1}
GroupPlayer.totalPoints = sum(all game points)
GroupPlayer.finalRank = ranked by totalPoints (tiebreak: most 1sts, then most top4s)
```

### 4.3 Prediction Flow

```
Window opens (09:00 VN for standard, startTime-60min for warmup)
  → User submits predictions (rank 1-4 per group)
  → Window closes (19:30 VN for standard, startTime for warmup)
  → Stage starts → predictions LOCKED
  → Stage COMPLETED → auto scorePredictionsForStage()
  → Scoring: each correct top-4 pick = 10pts (FINAL x2 = 20pts)
  → Send notifications to all predictors
  → If tie → admin triggers Duck Race tie-breaker via SSE broadcast
```

### 4.4 Real-time Data Flow (SSE)

```
Admin enters game result
  → API writes to DB
  → sseManager.broadcastToTournament(tournamentId, "game-result", data)
  → Also publishes to Redis pub/sub (for PM2 cluster)
  → All connected clients receive event
  → useSSE hook triggers re-fetch or updates local state
```

### 4.5 Authentication Flow

```
Login:
  → POST /api/auth/[...nextauth]
  → Credentials provider: email + bcrypt compare
  → Google provider: OAuth flow + auto-download avatar
  → JWT token (24h maxAge) with role, id, avatar, passwordChangedAt
  → Session cookie set

Auth Gate (proxy.ts):
  → Public routes: /, /auth/*, /tournaments/*, /leaderboard, /rules, /announcements, /api/health, /api/webhooks/*
  → Protected routes: require session cookie
  → Admin routes: additionally check session.user.role === "ADMIN"
```

### 4.6 Lockdown Flow

```
.lockdown file (ENABLED=true, IP whitelist)
  → proxy.ts reads file (cached 5s)
  → If enabled:
    → Check client IP against whitelist
    → Allowed: pass through
    → Blocked: return 503 maintenance page (HTML) or JSON error
  → Allows: static assets, /auth/*, /api/admin/lockdown, /api/health
```

---

## 5. Quy tắc viết code (Coding Conventions & Patterns)

### Design Patterns
| Pattern | Usage |
|---|---|
| **Singleton** | PrismaClient, Redis, SSEManager |
| **Cache-aside** | `cacheGetOrSet` with SETNX stampede protection |
| **Repository-like** | API routes directly use Prisma (no separate service layer) |
| **Barrel exports** | `components/ui/index.ts`, `components/tft/index.ts` |
| **Compound components** | Card + CardHeader + CardContent + CardTitle |
| **CVA variants** | Button, Badge component variants |

### Naming Conventions
| Type | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `TournamentCard.tsx` |
| Files (lib/utils) | kebab-case | `cache-invalidate.ts` |
| Files (API routes) | kebab-case | `route.ts` (fixed name) |
| Variables/functions | camelCase | `getPredictionWindow` |
| Constants | SCREAMING_SNAKE | `PREDICTABLE_STAGES` |
| Types/Interfaces | PascalCase | `PredictionWindowResult` |
| DB models | PascalCase | `Tournament`, `GroupPlayer` |
| DB enums | SCREAMING_SNAKE | `StageType.QUALIFIER` |
| CSS classes | kebab-case with prefix | `.sblt-card`, `.kn-reveal` |

### Error Handling
- **API routes:** `apiError(message, status)` returns `{ error: string }` JSON
- **Prisma errors:** `handleApiError(err)` maps P2025/P2002/P2003 etc. to Vietnamese messages
- **Auth errors:** Always return `{ error: "Unauthorized" }` with 401
- **Validation:** Zod schemas in `validations.ts`, return 400 with error details
- **Logging:** `logger.error()` sends to Sentry in production, console in dev

### State Management
- **Server-side:** Prisma queries in Server Components and API routes
- **Client-side:** React `useState`/`useEffect` for local state, SSE hooks for real-time
- **No global state library** (no Redux, Zustand, etc.)
- **Auth state:** NextAuth `useSession()` hook
- **Cache:** Redis with 3 TTL tiers (SHORT 30s, MEDIUM 120s, LONG 300s)

### Component Patterns
- **Server Components by default** — pages are server components unless `"use client"` is needed
- **Client Components** for: forms, SSE listeners, interactive UI (modals, toggles)
- **UI primitives** in `components/ui/` — all use CVA for variants
- **No CSS modules** — Tailwind utility classes + global `.sblt-*` classes

### API Conventions
- **REST-like:** GET for reads, POST for creates/actions, PUT for updates, DELETE for deletes
- **Auth check:** Every route starts with `const session = await auth()`
- **Slug resolution:** `resolveTournamentId(slugOrId)` supports both `/tournaments/abc-123` and `/tournaments/uuid`
- **Response format:** `{ data }` for success, `{ error: string }` for errors
- **Cache headers:** `Cache-Control: private, no-store` on user-specific data

---

## 6. Môi trường & Triển khai

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (with `?sslmode=require` for prod) |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `NEXTAUTH_URL` | Yes | Canonical URL (`https://sbltcup.dev`) |
| `AUTH_SECRET` | Yes | Same as NEXTAUTH_SECRET |
| `AUTH_URL` | Yes | Same as NEXTAUTH_URL |
| `ADMIN_EMAILS` | Yes | Comma-separated admin email addresses |
| `NODE_ENV` | Yes | `production` / `development` / `staging` |
| `AUTH_TRUST_HOST` | Yes | `true` for production |
| `REDIS_URL` | Yes | Redis connection string (`redis://localhost:6379`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `SENTRY_DSN` | No | Sentry error tracking DSN |
| `SMTP_HOST` | No | Email SMTP host |
| `SMTP_PORT` | No | Email SMTP port |
| `SMTP_USER` | No | Email SMTP username |
| `SMTP_PASS` | No | Email SMTP password |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | No | Web Push VAPID private key |
| `VAPID_SUBJECT` | No | Web Push VAPID subject (mailto:...) |
| `WEBHOOK_SECRET` | No | Google Forms webhook secret |

### Setup Steps

```bash
# 1. Install dependencies
npm ci

# 2. Setup database
npx prisma generate
npx prisma migrate deploy   # or `prisma db push` for dev

# 3. Seed data (optional)
npm run db:seed

# 4. Build
npm run build

# 5. Start (production)
pm2 start ecosystem.config.js

# 6. Verify
curl http://localhost:3000/api/health
```

### Deployment Architecture

```
GitHub Push → GitHub Actions CI (lint + test + build)
  → Self-hosted runner executes deploy.sh
    → git pull → npm ci → prisma migrate deploy → npm run build
    → pm2 reload ecosystem.config.js --update-env
    → Health check at /api/health
  → Rollback on failure (git reset + rebuild + restart)

PM2 Config:
  - sblt-cup: 2 instances, cluster mode, max 512MB each
  - sblt-worker: 1 instance, fork mode, max 256MB (skeleton)

Cloudflare:
  - DNS + proxy + WAF
  - IP Access Rules for lockdown
  - Under Attack Mode available
  - cf-connecting-ip header for real client IP
```

### Database

- **PostgreSQL 16** on localhost
- **Database name:** `sblt_cup_prod` (production), `sblt_cup_staging` (staging)
- **Connection pool:** max 10 (via PrismaPg adapter)
- **Slow query logging:** >100ms warn, >500ms Sentry alert
- **2 migrations:** init schema + notification tables

---

## 7. Hạn chế & Công việc tồn đọng

### Technical Debt
| Issue | Impact | Notes |
|---|---|---|
| PM2 cluster SSE sync relies on Redis pub/sub | Medium | If Redis goes down, SSE only works on one instance |
| In-memory rate limiting in proxy.ts | Medium | Per-instance, not shared across PM2 instances. Redis rate limiter exists in `rate-limit.ts` but proxy uses in-memory |
| Worker.js is a skeleton | Low | Background worker configured but `tick()` is empty |
| No automated database backups | High | Manual `pg_dump` only |
| `images.unoptimized: true` | Low | Disabled to fix PM2 cluster null errors, sacrifices image optimization |
| No email/VAPID configured in production | Low | SMTP and VAPID env vars not set — email/push notifications silently fail |

### Known Limitations
- **No Docker** — deployment is directly on host via PM2, no containerization
- **Single server** — all services (app, DB, Redis) on one machine
- **No staging environment in production** — staging script exists but not actively used
- **Vietnamese-only UI** — no i18n support
- **No automated tests in CI for E2E** — Playwright configured but not in CI pipeline
- **Lockdown is manual** — requires editing `.lockdown` file or calling admin API

### Potential Improvements
- Containerize with Docker for reproducible deployments
- Add database backup automation (cron + pg_dump + S3)
- Switch proxy rate limiting to Redis-backed (already have `rate-limit.ts`)
- Configure SMTP + VAPID for full notification support
- Add E2E tests to CI pipeline
- Implement i18n for multi-language support
- Add automated staging deployment
- Implement proper background job queue (BullMQ) instead of skeleton worker

---

## Appendix: Key Files Quick Reference

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Database schema (18 models, 10 enums) |
| `src/proxy.ts` | Middleware (lockdown, CSRF, rate-limit, auth) |
| `src/lib/auth.ts` | NextAuth v5 configuration |
| `src/lib/prisma.ts` | PrismaClient singleton |
| `src/lib/cache.ts` | Redis cache with stampede protection |
| `src/lib/sse.ts` | SSEManager singleton |
| `src/lib/constants.ts` | Domain constants (scoring, prizes, format) |
| `src/lib/predictions.ts` | Prediction window + scoring engine |
| `src/lib/notifications.ts` | Multi-channel notification system |
| `src/lib/validations.ts` | Zod schemas |
| `src/app/layout.tsx` | Root layout (fonts, metadata, providers) |
| `src/app/globals.css` | "Kinetic Noir" design system |
| `src/app/admin/tournaments/[id]/page.tsx` | Most complex admin page |
| `ecosystem.config.js` | PM2 configuration |
| `deploy.sh` | Production deploy script |
| `.lockdown` | Runtime lockdown config |
