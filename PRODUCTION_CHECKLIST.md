# SBLT CUP — Production Go-Live Checklist

## Environment & Secrets

- [ ] Regenerate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
- [ ] Verify all secrets are NOT in git history (`git log -p --all -S 'NEXTAUTH_SECRET'`)
- [ ] Set `REDIS_URL` for production Redis instance
- [ ] Set `WEBHOOK_SECRET` for Google Forms webhook (`openssl rand -hex 32`)
- [ ] Verify `NEXTAUTH_URL` matches production domain exactly (scheme + host)
- [ ] Set `NODE_ENV=production`
- [ ] Verify `ADMIN_EMAILS` contains correct admin addresses
- [ ] Configure SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
- [ ] Configure VAPID keys for push notifications
- [ ] Configure Sentry DSN for error monitoring
- [ ] Configure Google OAuth credentials for production domain

## Database

- [ ] Run `npx prisma migrate deploy` on production database
- [ ] Verify all indexes exist (check `prisma/schema.prisma`)
- [ ] Set up automated daily backups (`pg_dump` → S3/GCS)
- [ ] Configure PostgreSQL `max_connections` ≥ 100
- [ ] Consider PgBouncer for connection pooling (Prisma pool max=30 per instance × 2 instances = 60)
- [ ] Verify `DATABASE_URL` includes `?sslmode=require` for production

## Security

- [ ] Verify CSRF protection is active (`NEXTAUTH_URL` is set — proxy.ts fails closed)
- [ ] Verify rate limiting is working (Redis connected for API routes, in-memory for proxy)
- [ ] Run `npm audit --audit-level=high` and fix any findings
- [ ] Verify all security headers configured in `next.config.ts`
- [ ] Test webhook with `crypto.timingSafeEqual` (timing-safe comparison)
- [ ] Verify no stack traces leak in error responses
- [ ] Verify `trustHost` is `false` in production (auth.ts:39)
- [ ] Verify `allowDangerousEmailAccountLinking` is NOT set (removed)
- [ ] Test brute-force lockout on login (5 attempts → 15 min lockout)
- [ ] Verify session `maxAge` is 24 hours (auth.ts:38)

## Performance & Scalability

- [ ] Verify PM2 cluster mode configured (2 instances in `ecosystem.config.js`)
- [ ] Set PM2 `max_memory_restart` to 768M or 1G (currently 512M)
- [ ] Test with 100+ concurrent connections
- [ ] Verify SSE real-time updates work across both PM2 instances (Redis pub/sub)
- [ ] Monitor DB connection pool usage (max=30 per instance)
- [ ] Verify SSE client limit (MAX_CLIENTS=5000) works
- [ ] Test tournament detail API response time with full graph (5 levels nested)

## Application Features

- [ ] Test full auth flow: register → login → forgot password → reset password
- [ ] Test Google OAuth sign-in flow
- [ ] Test tournament flow: create → register → submit results → advance stage
- [ ] Test predictions flow: submit prediction → view leaderboard
- [ ] Test webhook: valid secret accepted, invalid secret rejected (401)
- [ ] Test admin dashboard: analytics, user management
- [ ] Verify real-time SSE updates: game results, standings, brackets
- [ ] Test push notification delivery

## CI/CD & Deployment

- [ ] Verify GitHub Actions deploy workflow passes
- [ ] Test rollback procedure (`deploy.sh` rollback function)
- [ ] Verify health check endpoint (`/api/health`) responds after deploy
- [ ] Add `npm audit` to CI pipeline
- [ ] Verify `prisma migrate deploy` runs in deploy script
- [ ] Test deploy to staging environment first

## Monitoring & Alerting

- [ ] Verify Sentry DSN configured and receiving errors
- [ ] Set up uptime monitoring (ping `/api/health`)
- [ ] Configure Sentry alerts for error spikes
- [ ] Monitor PM2 logs for crashes (`pm2 logs`)
- [ ] Set up slow query monitoring (>100ms logged via Prisma extension)
- [ ] Monitor SSE connection count and pub/sub health

## Backup & Recovery

- [ ] Document database backup schedule
- [ ] Test backup restoration procedure
- [ ] Document rollback procedure for bad deploys
- [ ] Document rollback procedure for bad migrations
- [ ] Verify `deploy.sh` backup function works before migrations

## Post-Go-Live

- [ ] Monitor error rates for first 24 hours
- [ ] Monitor database connection pool saturation
- [ ] Monitor SSE connection stability
- [ ] Verify all cron jobs / background tasks running
- [ ] Confirm team knows how to rollback if issues arise
