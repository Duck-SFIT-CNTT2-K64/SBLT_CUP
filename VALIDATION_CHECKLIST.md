# ✅ VALIDATION CHECKLIST — How to verify each task is complete

**Purpose**: Each task has specific acceptance criteria. This file provides step-by-step verification.

---

## 🔴 CRITICAL VALIDATIONS

### CRITICAL-01: Add tests to GitHub Actions deploy pipeline

**Verify**:
```bash
# 1. Check if deploy.yml has test job
grep -A 10 "^jobs:" .github/workflows/deploy.yml | grep -q "test:"

# Expected: Should see a test job before deploy job
# Result: ✅ PASS if grep finds test job, ❌ FAIL if not found
```

**Manual Check**:
```bash
# 2. Read the workflow file
cat .github/workflows/deploy.yml

# Look for:
# ✅ PASS if contains:
#   - jobs:
#       test:
#         runs-on: ubuntu-latest
#         steps:
#           - npm run test
#           - npm run build
#       deploy:
#         needs: test  # ← CRITICAL: deploy depends on test
#         if: success()
#
# ❌ FAIL if:
#   - No test job, OR
#   - deploy job doesn't have "needs: test"
```

**CI Verification**:
```bash
# 3. Trigger test by pushing to PR
git checkout -b test/ci-verify
git push origin test/ci-verify

# On GitHub Actions UI, check:
# ✅ PASS if workflow shows:
#   ✓ test job ran and passed
#   ✓ deploy job blocked until test passed
#
# ❌ FAIL if deploy runs without test
```

---

### CRITICAL-02: Validate ADMIN_EMAILS environment variable format

**Code Check**:
```bash
# 1. Check if ADMIN_EMAILS validation exists
grep -r "ADMIN_EMAILS" src/lib/

# Expected files: env.ts, auth.ts
# ✅ PASS if env.ts has Zod schema validation
# ❌ FAIL if no validation
```

**Validation**:
```bash
# 2. Verify env.ts has email validation
grep -A 3 "ADMIN_EMAILS" src/lib/env.ts

# ✅ PASS if shows:
#   ADMIN_EMAILS: z.string()
#     .min(1, "ADMIN_EMAILS is required")
#     .refine((val) => {
#       const emails = val.split(",").map(e => e.trim());
#       return emails.every(e => z.string().email().safeParse(e).success);
#     })
#
# ❌ FAIL if validation missing
```

**Startup Test**:
```bash
# 3. Test with invalid ADMIN_EMAILS
export ADMIN_EMAILS="invalid-email,another@bad"
npm run dev

# ✅ PASS if app crashes with clear error message:
#   "Environment variable validation failed:
#    - ADMIN_EMAILS: invalid email format at position 0"
#
# ❌ FAIL if app starts normally or error is unclear
```

**Reset**:
```bash
# Set back to valid value
export ADMIN_EMAILS="admin@sblt.local"
```

---

### CRITICAL-03: Fix Prisma error handler to cover all critical codes

**Code Review**:
```bash
# 1. Check api-error.ts
cat src/lib/api-error.ts | grep -A 20 "switch (prismaErr.code)"

# ✅ PASS if switch statement includes:
#   - P2025: NOT_FOUND (404)
#   - P2002: DUPLICATE (409)
#   - P2003: FOREIGN_KEY_CONSTRAINT_FAILED (409)
#   - P2014: REQUIRED_RELATION_VIOLATION (400)
#   - P2005: INVALID_FIELD_VALUE (400)
#   - default: DATABASE_ERROR (500)
#
# ❌ FAIL if any of above missing
```

**Unit Test**:
```bash
# 2. Run error handler tests
npm run test -- api-error

# ✅ PASS if all tests pass, including:
#   - P2025 returns 404 NOT_FOUND
#   - P2002 returns 409 DUPLICATE
#   - P2003 returns 409 FOREIGN_KEY_CONSTRAINT_FAILED
#   - Unknown code returns 500 DATABASE_ERROR
#
# ❌ FAIL if any test fails
```

---

### CRITICAL-04: Add CI test gate before production deploy

**Workflow Check** (same as CRITICAL-01):
```bash
# Verify deploy job requires test job
grep -A 2 "deploy:" .github/workflows/deploy.yml | grep "needs: test"

# ✅ PASS if found, ❌ FAIL if not
```

---

### CRITICAL-05: Add request logging middleware for all API calls

**Code Check**:
```bash
# 1. Verify middleware.ts has logging
grep -A 5 "export function middleware" src/middleware.ts | grep -q "logger.info"

# ✅ PASS if logs API calls, ❌ FAIL if not
```

**Logger Output Test**:
```bash
# 2. Start dev server
npm run dev

# 3. Make API request in another terminal
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Pass123","name":"Test","ign":"test"}'

# ✅ PASS if you see in console logs:
#   [2026-05-09T10:30:15.123Z] [INFO] API request {
#     "method": "POST",
#     "path": "/api/auth/register",
#     "status": 400,  # or 201 if created
#     "latencyMs": 45,
#     "userId": null
#   }
#
# ❌ FAIL if no structured log appears
```

**Check All Methods**:
```bash
# 3. Test GET, POST, PUT, DELETE to verify logging works for all
curl http://localhost:3000/api/health
curl http://localhost:3000/api/predictions/leaderboard
# ... etc

# Each should produce a log entry
```

---

## 🟠 HIGH VALIDATIONS

### HIGH-01: Create E2E tests for auth flow

**File Exists**:
```bash
# ✅ PASS if file exists
test -f src/__tests__/e2e/auth.e2e.test.ts && echo "✅ EXISTS"

# ❌ FAIL if not found
```

**Test Runs**:
```bash
# ✅ PASS if tests pass
npm run test -- auth.e2e

# Expected output:
#   ✓ User can register with valid credentials
#   ✓ User receives validation error with weak password
#   ✓ User can login after registration
#   ✓ User is redirected to dashboard after login
#   ✓ User can logout and is redirected to login
#
# ❌ FAIL if any test fails or file doesn't exist
```

---

### HIGH-02: Create E2E test for tournament booking + prediction flow

**File Exists**:
```bash
test -f src/__tests__/e2e/tournament.e2e.test.ts && echo "✅ EXISTS"
```

**Test Runs**:
```bash
npm run test -- tournament.e2e

# Expected: 3-5 passing E2E tests
```

---

### HIGH-03: Fix deploy.sh hardcoded paths to use environment variables

**Code Check**:
```bash
# 1. Verify no hardcoded paths
grep -n "cd /path/to" deploy.sh && echo "❌ FAIL: Hardcoded path found" || echo "✅ PASS"

grep -n 'pm2 restart sblt-cup' deploy.sh && echo "❌ FAIL: Hardcoded app name" || echo "✅ PASS"

# 2. Check if env vars used
grep -q 'DEPLOY_PATH=${DEPLOY_PATH:-' deploy.sh && echo "✅ Uses env with fallback"
grep -q 'PM2_APP_NAME=${PM2_APP_NAME:-' deploy.sh && echo "✅ Uses env with fallback"
```

**Verify Fallbacks**:
```bash
# Without env vars, should use defaults
bash deploy.sh --dry-run

# ✅ PASS if:
#   - Uses fallback values from script
#   - Shows what it would do
#
# ❌ FAIL if requires env vars set or fails
```

---

### HIGH-04: Implement Redis rate limiter

**Dependency Check**:
```bash
# ✅ PASS if redis dependency added
grep -q "redis" package.json && echo "✅ Redis added"

# ❌ FAIL if not in package.json
```

**Config Check**:
```bash
# ✅ PASS if middleware connects to Redis
grep -q "redis.createClient" src/middleware.ts || grep -q "Redis" src/middleware.ts
```

**Functionality Test**:
```bash
# Start Redis locally (if needed)
docker run -d -p 6379:6379 redis:latest

# Run middleware tests
npm run test -- middleware

# ✅ PASS if rate limit persists across server restart
# ❌ FAIL if in-memory fallback still used
```

---

### HIGH-05: Implement per-route rate limits

**Code Check**:
```bash
# Verify different limits for different routes
grep -A 5 "checkRateLimit" src/middleware.ts | grep -E "login|auth" 

# ✅ PASS if auth routes have stricter limits (3 attempts)
# ❌ FAIL if all routes same limit
```

---

### HIGH-06: Update README with setup instructions

**README Check**:
```bash
# ✅ PASS if README has all sections:
grep -q "## Setup" README.md && echo "✅ Setup section"
grep -q "## Environment Variables" README.md && echo "✅ Env vars section"
grep -q "## Running Tests" README.md && echo "✅ Tests section"
grep -q "## Deployment" README.md && echo "✅ Deployment section"

# ❌ FAIL if any section missing
```

**Content Quality**:
```bash
# Read README and verify:
cat README.md

# ✅ PASS if contains:
#   - npm install, npm run dev steps
#   - List of all required env vars with descriptions
#   - npm run test explanation
#   - deploy.sh instructions
#   - Health check verification step
```

---

### HIGH-07: Tune Sentry configuration for production

**Config Check**:
```bash
# Check trace sampling
grep "tracesSampleRate" sentry.client.config.ts

# ✅ PASS if shows: 0.2 or higher (but ≤ 0.5)
# ❌ FAIL if still 0.1
```

**Session Replay Check**:
```bash
grep "replaysSessionSampleRate" sentry.client.config.ts

# ✅ PASS if shows: 0.3 or higher
# ❌ FAIL if still 0.1
```

---

## 🟡 MEDIUM VALIDATIONS

### MEDIUM-01: Add integration tests

```bash
# Folder exists
test -d src/__tests__/integration && echo "✅ Integration tests folder exists"

# Tests pass
npm run test -- integration

# ✅ PASS if 3+ passing tests covering:
#   - Register → Create Tournament → Join Tournament
#   - Join Tournament → Make Prediction → View Results
#   - Create Dispute → Update Dispute → Resolve
```

---

### MEDIUM-02: Complete jest.config setup file

```bash
# Check setup file
cat src/__tests__/setup.ts | wc -l

# ✅ PASS if > 10 lines with mocks
# ❌ FAIL if only 1 line
```

---

### MEDIUM-03: Add test coverage thresholds

```bash
# Check jest config
grep -A 5 "coverageThreshold" jest.config.js

# ✅ PASS if shows:
#   coverageThreshold: {
#     global: { lines: 70, functions: 70, branches: 65 }
#   }
```

**Verify Enforcement**:
```bash
npm run test:coverage

# ✅ PASS if shows coverage report and enforces thresholds
# Test with coverage below threshold should fail
```

---

### MEDIUM-04: Add rollback strategy

```bash
# Check deploy.sh has rollback logic
grep -q "git revert" deploy.sh && echo "✅ Rollback exists"

# ✅ PASS if can rollback on failure
# ❌ FAIL if no rollback strategy
```

---

### MEDIUM-05: Migrate middleware to new Next.js proxy pattern

```bash
# Run build to check for deprecation warnings
npm run build 2>&1 | grep -i "middleware"

# ✅ PASS if NO warnings about middleware
# ❌ FAIL if still shows deprecation warning
```

---

### MEDIUM-06: Add database migration validation in health check

```bash
# Call health endpoint
curl http://localhost:3000/api/health

# ✅ PASS if response includes:
# {
#   "status": "ok",
#   "database": "connected",
#   "schema_status": "in-sync",
#   "uptime": 1234
# }
#
# ❌ FAIL if schema_status field missing
```

---

## 🎯 MASTER VALIDATION SCRIPT

Run this to validate ALL critical tasks at once:

```bash
#!/bin/bash
echo "🔍 Validating Production Readiness..."

PASS=0
FAIL=0

# CRITICAL-01
if grep -q "needs: test" .github/workflows/deploy.yml 2>/dev/null; then
  echo "✅ CRITICAL-01: CI test gate"
  ((PASS++))
else
  echo "❌ CRITICAL-01: CI test gate"
  ((FAIL++))
fi

# CRITICAL-03
if grep -q "P2003" src/lib/api-error.ts 2>/dev/null; then
  echo "✅ CRITICAL-03: Prisma error handler"
  ((PASS++))
else
  echo "❌ CRITICAL-03: Prisma error handler"
  ((FAIL++))
fi

# CRITICAL-05
if grep -q "latencyMs" src/middleware.ts 2>/dev/null; then
  echo "✅ CRITICAL-05: Request logging"
  ((PASS++))
else
  echo "❌ CRITICAL-05: Request logging"
  ((FAIL++))
fi

# HIGH-06
if grep -q "## Deployment" README.md 2>/dev/null; then
  echo "✅ HIGH-06: README updated"
  ((PASS++))
else
  echo "❌ HIGH-06: README updated"
  ((FAIL++))
fi

echo ""
echo "📊 Results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && echo "🚀 READY FOR PRODUCTION" || echo "⚠️  Still in progress"
```

---

