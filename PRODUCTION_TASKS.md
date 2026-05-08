# 🚀 PRODUCTION TASKS — SBLT CUP

**Status**: In Progress  
**Last Updated**: 2026-05-09  
**Target**: Production Ready (100% complete)

---

## 📋 TASK MATRIX

Format: `[Task ID] | Priority | Status | Category | Owner`

### 🔴 CRITICAL — Must fix before any deploy

- [x] **CRITICAL-01** | 🔴 P0 | `DONE` | **CI/CD** | Bot
  - **Title**: Add tests to GitHub Actions deploy pipeline
  - **Description**: Deploy workflow currently skips tests. Need to add test job before deploy.
  - **Acceptance**: Tests run on every PR/push main, deploy blocks if tests fail
  - **Files**: `.github/workflows/deploy.yml`
  - **Effort**: 0.5h
  - **Blocked by**: None
  - **Completed**: 2026-05-09 [Loop Iteration #1]

- [x] **CRITICAL-02** | 🔴 P0 | `DONE` | **Validation** | Bot
  - **Title**: Validate ADMIN_EMAILS environment variable format
  - **Description**: NextAuth.ts splits ADMIN_EMAILS by comma but doesn't validate format. Should validate email regex + non-empty.
  - **Acceptance**: App crashes at startup if ADMIN_EMAILS invalid, with clear error message
  - **Files**: `src/lib/auth.ts`, `src/lib/env.ts`
  - **Effort**: 0.5h
  - **Blocked by**: None
  - **Completed**: 2026-05-09 [Loop Iteration #2]

- [x] **CRITICAL-03** | 🔴 P0 | `DONE` | **Security** | Bot
  - **Title**: Fix Prisma error handler to cover all critical codes
  - **Description**: Currently only handles P2025, P2002. Missing P2003, P2014, P2005.
  - **Acceptance**: All Prisma error codes mapped to proper HTTP status + error message
  - **Files**: `src/lib/api-error.ts`
  - **Effort**: 1h
  - **Blocked by**: None
  - **Completed**: 2026-05-09 [Loop Iteration #3]

- [x] **CRITICAL-04** | 🔴 P0 | `DONE` | **Deployment** | Bot
  - **Title**: Add CI test gate before production deploy
  - **Description**: GitHub Actions should not deploy if tests fail or build fails.
  - **Acceptance**: Workflow has test job, deploy job requires test job success
  - **Files**: `.github/workflows/deploy.yml`, `deploy.sh`
  - **Effort**: 0.5h
  - **Blocked by**: CRITICAL-01 ✅
  - **Completed**: 2026-05-09 [Loop Iteration #4]

- [x] **CRITICAL-05** | 🔴 P0 | `DONE` | **Logging** | Bot
  - **Title**: Add request logging middleware for all API calls
  - **Description**: No structured logs for API latency, status, userId. Needed for debugging production issues.
  - **Acceptance**: All API calls logged with timestamp, method, path, status, duration, userId
  - **Files**: `src/lib/logging.ts`, `src/middleware.ts`
  - **Effort**: 2h
  - **Blocked by**: None
  - **Completed**: 2026-05-09 [Loop Iteration #5]
  - **Acceptance**: Every API call logs method/path/status/latencyMs/userId in structured format
  - **Files**: `src/middleware.ts`
  - **Effort**: 1.5h
  - **Blocked by**: None

---

### 🟠 HIGH — Should fix before production

- [x] **HIGH-01** | 🟠 P1 | `DONE` | **Testing** | Bot
  - **Title**: Create E2E tests for auth flow (register → login → dashboard)
  - **Description**: Only unit tests exist. Need Playwright tests for user journey.
  - **Acceptance**: Playwright test suite with 5+ scenarios passes on CI
  - **Files**: `src/__tests__/e2e/`, `playwright.config.ts`
  - **Effort**: 3h
  - **Blocked by**: CRITICAL-01 ✅
  - **Completed**: 2026-05-09 [Loop Iteration #6]

- [x] **HIGH-02** | 🟠 P1 | `DONE` | **Testing** | Bot
  - **Title**: Create E2E test for tournament booking + prediction flow
  - **Description**: Complex flow: join tournament → predict → view leaderboard
  - **Acceptance**: E2E test covers full tournament flow
  - **Files**: `src/__tests__/e2e/tournament.spec.ts` (new)
  - **Effort**: 4h
  - **Blocked by**: CRITICAL-01
  - **Completed**: 2026-05-08 [Loop Iteration #7]

- [x] **HIGH-03** | 🟠 P1 | `DONE` | **Deployment** | Bot
  - **Title**: Fix deploy.sh hardcoded paths to use environment variables
  - **Description**: Paths like `/path/to/sblt-cup` and app name `sblt-cup` should come from env
  - **Acceptance**: deploy.sh reads DEPLOY_PATH and PM2_APP_NAME from env with fallbacks
  - **Files**: `deploy.sh`
  - **Effort**: 0.5h
  - **Blocked by**: None
  - **Completed**: 2026-05-08 [Loop Iteration #8]

- [x] **HIGH-04** | 🟠 P1 | `DONE` | **Security** | Bot
  - **Title**: Implement Redis rate limiter (replace in-memory)
  - **Description**: In-memory rate limit resets on deploy. Need persistent store.
  - **Acceptance**: Rate limit state survives app restart, uses Redis with TTL
  - **Files**: `src/lib/rate-limit.ts` (new), `src/app/api/auth/register/route.ts`, `src/lib/env.ts`
  - **Effort**: 2h
  - **Blocked by**: None
  - **Note**: Can fallback to in-memory with warning if Redis unavailable
  - **Completed**: 2026-05-08 [Loop Iteration #9]

- [x] **HIGH-05** | 🟠 P1 | `DONE` | **Security** | Bot
  - **Title**: Implement per-route rate limits
  - **Description**: Currently all routes share same limit. /auth/login should have stricter limits.
  - **Acceptance**: Login routes: 3 attempts/15min. API routes: 60 req/min. Public routes: 100 req/min.
  - **Files**: `src/middleware.ts`
  - **Effort**: 1h
  - **Blocked by**: HIGH-04
  - **Completed**: 2026-05-08 [Loop Iteration #10]

- [x] **HIGH-06** | 🟠 P1 | `DONE` | **Documentation** | Bot
  - **Title**: Update README with setup instructions and deployment guide
  - **Description**: README still generic template. Needs SBLT CUP specific docs.
  - **Acceptance**: README has sections: setup, env vars, running tests, deployment steps
  - **Files**: `README.md`
  - **Effort**: 1.5h
  - **Blocked by**: None
  - **Completed**: 2026-05-08 [Loop Iteration #11]

- [x] **HIGH-07** | 🟠 P1 | `DONE` | **Monitoring** | Bot
  - **Title**: Tune Sentry configuration for production
  - **Description**: Trace sampling too low (0.1). Session replay sampling should be higher.
  - **Acceptance**: Production config: tracesSampleRate 0.2, replaysSessionSampleRate 0.3
  - **Files**: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
  - **Effort**: 0.5h
  - **Blocked by**: None
  - **Completed**: 2026-05-08 [Loop Iteration #12]

---

### 🟡 MEDIUM — Nice to have before production

- [x] **MEDIUM-01** | 🟡 P2 | `DONE` | **Testing** | Bot
  - **Title**: Add integration tests for API flows (register → dispute creation → resolution)
  - **Description**: Current tests are isolated unit tests. Need integration test suite.
  - **Acceptance**: Integration test suite with 3+ complete flows, passes on CI
  - **Files**: `src/__tests__/integration/tournament-flow.test.ts` (new)
  - **Effort**: 4h
  - **Blocked by**: CRITICAL-01
  - **Completed**: 2026-05-08 [Loop Iteration #13]

- [x] **MEDIUM-02** | 🟡 P2 | `DONE` | **Quality** | Bot
  - **Title**: Complete jest.config.ts setup file
  - **Description**: setup.ts only has 1 line. Need to mock Sentry, Prisma, env.
  - **Acceptance**: setup.ts includes mocks for Sentry, prisma, process.env, fetch
  - **Files**: `src/__tests__/setup.ts`
  - **Effort**: 1h
  - **Blocked by**: None
  - **Completed**: 2026-05-08 [Loop Iteration #14]

- [x] **MEDIUM-03** | 🟡 P2 | `DONE` | **Quality** | Bot
  - **Title**: Add test coverage thresholds to jest.config.js
  - **Description**: No coverage requirements. Should enforce minimum thresholds.
  - **Acceptance**: jest config has coverageThreshold: lines 70%, functions 70%, branches 65%
  - **Files**: `jest.config.js`
  - **Effort**: 0.5h
  - **Blocked by**: MEDIUM-01
  - **Completed**: 2026-05-08 [Loop Iteration #15]

- [x] **MEDIUM-04** | 🟡 P2 | `DONE` | **Deployment** | Bot
  - **Title**: Add rollback strategy to deploy pipeline
  - **Description**: Currently no automated rollback if deploy fails.
  - **Acceptance**: deploy.sh can rollback to previous git commit on failure
  - **Files**: `deploy.sh`
  - **Effort**: 1h
  - **Blocked by**: HIGH-03
  - **Completed**: 2026-05-08 [Loop Iteration #16]

- [x] **MEDIUM-05** | 🟡 P2 | `DONE` | **Architecture** | Bot
  - **Title**: Migrate middleware.ts to new Next.js proxy pattern
  - **Description**: middleware.ts file convention deprecated. Should use proxy instead.
  - **Acceptance**: Middleware logic moved to new pattern, no deprecation warning
  - **Files**: `src/proxy.ts` (renamed from middleware.ts)
  - **Effort**: 1.5h
  - **Blocked by**: None
  - **Completed**: 2026-05-08 [Loop Iteration #17]

- [x] **MEDIUM-06** | 🟡 P2 | `DONE` | **Database** | Bot
  - **Title**: Add database migration validation in health check
  - **Description**: Health check doesn't verify migrations are up-to-date.
  - **Acceptance**: /api/health returns schema_status field showing if schema matches prisma
  - **Files**: `src/app/api/health/route.ts`
  - **Effort**: 1h
  - **Blocked by**: None
  - **Completed**: 2026-05-08 [Loop Iteration #18]

---

### 🟢 LOW — After production launch

- [x] **LOW-01** | 🟢 P3 | `DONE` | **Quality** | Bot
  - **Title**: Set up staging environment with separate database
  - **Description**: Currently no staging. Should test on staging before prod deploy.
  - **Acceptance**: Staging deployment script + separate DB configured
  - **Files**: `deploy-staging.sh` (new), `.env.staging` (new)
  - **Effort**: 2h
  - **Blocked by**: HIGH-03
  - **Completed**: 2026-05-08 [Loop Iteration #19]

- [x] **LOW-02** | 🟢 P3 | `DONE` | **Quality** | Bot
  - **Title**: Tighten package.json dependency versions
  - **Description**: Using ^ which allows minor+patch. Should use ~ for production.
  - **Acceptance**: Critical deps pinned to ~ (patch only), package-lock.json locked
  - **Files**: `package.json`
  - **Effort**: 1h
  - **Blocked by**: None
  - **Completed**: 2026-05-08 [Loop Iteration #20]

- [x] **LOW-03** | 🟢 P3 | `DONE` | **Documentation** | Bot
  - **Title**: Create API documentation (OpenAPI/Swagger)
  - **Description**: No auto-generated API docs. Useful for frontend team.
  - **Acceptance**: Swagger UI at /api-docs, all routes documented
  - **Files**: `src/app/api-docs/page.tsx` (new), `src/app/api/openapi/route.ts` (new)
  - **Effort**: 3h
  - **Blocked by**: None
  - **Completed**: 2026-05-08 [Loop Iteration #21]

- [x] **LOW-04** | 🟢 P3 | `DONE` | **Performance** | Bot
  - **Title**: Add database query performance monitoring
  - **Description**: No visibility into slow queries.
  - **Acceptance**: Slow queries (>100ms) logged with Sentry
  - **Files**: `src/lib/prisma.ts`
  - **Effort**: 1h
  - **Blocked by**: None
  - **Completed**: 2026-05-08 [Loop Iteration #22]

---

## 📊 PROGRESS SUMMARY

| Priority | Total | Done | % |
|----------|-------|------|---|
| 🔴 Critical | 5 | 5 | 100% |
| 🟠 High | 7 | 7 | 100% |
| 🟡 Medium | 6 | 6 | 100% |
| 🟢 Low | 4 | 4 | 100% |
| **TOTAL** | **22** | **22** | **100%** |

---

## 🎯 DEFINITION OF DONE

✅ **Production Ready** when ALL of these are TRUE:
1. All 🔴 CRITICAL tasks completed
2. All 🟠 HIGH tasks completed
3. Tests passing: `npm run test:coverage` shows >70% lines/functions, >65% branches
4. Build succeeds: `npm run build` with 0 errors, 0 warnings
5. Health check passes: `curl http://localhost:3000/api/health` returns 200 with schema_status OK
6. Deploy workflow blocks deploy if tests fail
7. README updated with setup + deployment instructions
8. Sentry configured and monitoring active

---

## 🔄 USAGE FOR BOT AUTONOMY

**Bot should**:
1. Read this file at start of each loop
2. Find first `[ ]` item (not done)
3. Check blockers - if all blockers done, start task
4. Run validation from `VALIDATION_CHECKLIST.md` 
5. If validation fails, use `BOT_AUTONOMY_LOOP.md` to self-debug
6. Mark task `[x]` when done
7. Loop back to step 2

**Human can**:
- Update task status manually (e.g., `[x] CRITICAL-01`)
- Add new tasks following same format
- Move tasks between priorities if scope changes
- Comment on task (use `<!-- comment -->`) if blocked

---

