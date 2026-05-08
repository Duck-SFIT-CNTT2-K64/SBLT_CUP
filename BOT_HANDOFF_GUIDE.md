# 🤖 Bot Handoff Guide — Production Task Loop

## 📌 Current Status (as of 2026-05-09)

**Completed**: 6/22 tasks (27.3%)
- ✅ CRITICAL-01: Add tests to GitHub Actions deploy pipeline
- ✅ CRITICAL-02: Validate ADMIN_EMAILS environment variable format
- ✅ CRITICAL-03: Fix Prisma error handler to cover all critical codes
- ✅ CRITICAL-04: Add CI test gate before production deploy
- ✅ CRITICAL-05: Add request logging middleware for all API calls
- ✅ HIGH-01: Set up E2E testing framework with Playwright

**Remaining**: 16/22 tasks (72.7%)
- 6 HIGH priority tasks (HIGH-02 through HIGH-07)
- 6 MEDIUM priority tasks (MEDIUM-01 through MEDIUM-06)
- 4 LOW priority tasks (LOW-01 through LOW-04)

---

## 🎯 Instructions for Next Bot Agent

### **Step 1: Understand the Loop Workflow**

The autonomous bot follows an 8-step loop (documented in `BOT_AUTONOMY_LOOP.md`):

1. **INITIALIZATION** — Read core files (PRODUCTION_TASKS.md, validation procedures)
2. **FIND NEXT TASK** — Use `grep "^\- \[ \]" PRODUCTION_TASKS.md | head -1`
3. **VERIFY BLOCKERS** — Check if task has blockers listed; if blocked, skip to next
4. **UNDERSTAND REQUIREMENT** — Read task details (Title, Description, Acceptance, Files)
5. **IMPLEMENT** — Make code changes to specified files
6. **VALIDATE** — Run validation checks from VALIDATION_CHECKLIST.md
7. **MARK COMPLETE** — Update PRODUCTION_TASKS.md: change `- [ ]` to `- [x]`
8. **COMMIT** — `git add`, `git commit -m "[TASK-ID] Task Title"`, `git push origin main`
9. **LOOP** — Return to step 2 for next task

### **Step 2: Prerequisites Check**

Before starting, run these commands to verify setup:

```bash
# 1. Verify git status is clean
git status

# 2. Verify on main branch
git branch

# 3. Verify node_modules installed
npm list | head -5

# 4. Verify database running (if needed for testing)
curl http://localhost:5432 2>&1 | head -1

# 5. Read task tracker
cat PRODUCTION_TASKS.md | grep "^\- \[ \]" | head -1
```

All should return ✅ ready state.

### **Step 3: Start the Loop**

Copy this prompt and give it to the next bot agent:

---

## 🚀 **BOT EXECUTION PROMPT (Copy to Next Agent)**

```
You are an autonomous production deployment bot executing a 22-task loop.

CONTEXT:
- Project: TFT SBLT CUP (Next.js 16 + TypeScript + Prisma 7)
- Loop Status: 6/22 DONE, 16/22 REMAINING
- Location: d:\no_toc\tft-giai-dau
- All files modified so far: Already committed to git main branch

YOUR MISSION:
Continue autonomous task execution from PRODUCTION_TASKS.md.
Execute the 8-step loop systematically until all 22 tasks are marked [x] DONE.

EXECUTION RULES:
1. ALWAYS follow 8-step loop exactly as documented in BOT_AUTONOMY_LOOP.md
2. NEVER skip validation steps — every task must pass acceptance criteria
3. NEVER commit without marking task [x] in PRODUCTION_TASKS.md
4. ALWAYS git push after each commit
5. STOP IMMEDIATELY if: git conflicts, 3x test failures, blocked task, security issue

STARTING POINT:
Next task is HIGH-02 (found at line ~75 in PRODUCTION_TASKS.md).
Read current PRODUCTION_TASKS.md to find first `- [ ]` item.

FILES TO USE:
- PRODUCTION_TASKS.md — Task list with status
- BOT_AUTONOMY_LOOP.md — 8-step workflow
- VALIDATION_CHECKLIST.md — Validation procedures
- BOT_AUTONOMY_LOOP.md → Self-Debug section for troubleshooting

LOOP ITERATION COUNTER:
Previous iterations: 1-6 (CRITICAL-01 through HIGH-01)
This agent should start with: Iteration #7 (HIGH-02)

GO: Execute 8-step loop starting with finding next incomplete task.
```

---

## 📊 Task Completion Tracking

```
✅ COMPLETE (6 tasks):
- CRITICAL-01, CRITICAL-02, CRITICAL-03, CRITICAL-04, CRITICAL-05
- HIGH-01

🔲 REMAINING (16 tasks):
- HIGH-02, HIGH-03, HIGH-04, HIGH-05, HIGH-06, HIGH-07
- MEDIUM-01 through MEDIUM-06
- LOW-01 through LOW-04
```

---

## 🔍 Quick Reference: Files to Modify by Category

### **HIGH Priority Tasks**
- **HIGH-02**: Tournament E2E tests → `src/__tests__/e2e/tournament.spec.ts`
- **HIGH-03**: Integration tests → `src/__tests__/integration/`
- **HIGH-04**: Sentry config → `sentry.*.config.ts` (3 files)
- **HIGH-05**: Jest coverage → `jest.config.js`
- **HIGH-06**: Prisma logging → `src/lib/prisma.ts`
- **HIGH-07**: Audit logging → `src/lib/audit.ts` (new) + routes

### **MEDIUM Priority Tasks**
- MEDIUM-01 through MEDIUM-06 (database queries, API improvements)

### **LOW Priority Tasks**
- LOW-01 through LOW-04 (documentation, performance)

---

## ✅ Validation Commands

Run these to verify completion:

```bash
# Test suite
npm run test

# Build check
npm run build

# Lint check
npm run lint

# Database migration status
npx prisma migrate status

# API health check
curl http://localhost:3000/api/health

# Git log (verify commits)
git log --oneline | head -10
```

---

## 🚨 Troubleshooting Reference

### **If Task Blocked**
```bash
# Find which task blocks this one
grep "Blocked by:" PRODUCTION_TASKS.md | grep "$(task-name)"

# Solution: Skip to next unblocked task
grep "^\- \[ \]" PRODUCTION_TASKS.md | head -2 | tail -1
```

### **If Test Fails**
```bash
# Run specific test
npm run test -- --testNamePattern="specific test name"

# Read error
npm run test 2>&1 | tail -50

# Solution: Fix the issue, re-run test, then commit
```

### **If Git Conflict**
```bash
# Abort merge
git merge --abort

# Or resolve manually
git status  # See conflicted files
# Edit files, then:
git add .
git commit -m "Resolve merge conflict"
```

### **If Build Fails**
```bash
npm run build 2>&1 | tail -100
# Fix TypeScript/build errors
npm run build  # Retry
```

---

## 📝 Execution Template

For each iteration, log this:

```
================================================================================
BOT ITERATION #[N]
Time: [TIMESTAMP]
Task: [TASK-ID] — [Task Title]
================================================================================

STEP 1: INITIALIZE ✅
STEP 2: FIND TASK ✅ → [TASK-ID]
STEP 3: CHECK BLOCKERS ✅ → [No blockers/Blocked by: ...]
STEP 4: UNDERSTAND ✅ → [Acceptance criteria understood]
STEP 5: IMPLEMENT ✅ → [Files modified: ...]
STEP 6: VALIDATE ✅ → [Tests: PASS / Build: PASS]
STEP 7: MARK COMPLETE ✅ → [x] marked in PRODUCTION_TASKS.md
STEP 8: COMMIT ✅ → [TASK-ID] ... git push
STEP 9: LOOP → Finding next task...
```

---

## 🎯 Success Criteria (When All 22 Done)

```
✅ All tasks marked [x] in PRODUCTION_TASKS.md
✅ 22 git commits (one per task)
✅ npm run test → All tests pass
✅ npm run build → 0 errors
✅ curl http://localhost:3000/api/health → 200 OK
✅ npm run lint → No errors
✅ 70%+ code coverage
```

---

## 📞 Escalation Criteria

STOP and escalate if:
1. **3+ consecutive validation failures** on same task
2. **Git conflicts** that can't auto-resolve
3. **Database connection error** persists >2 attempts
4. **Security vulnerability** discovered
5. **Blocker not in task list** discovered
6. **External service down** (database, GitHub, npm registry)

---

## 🔗 Core Files for Reference

1. **`PRODUCTION_TASKS.md`** — Task list (marks progress here)
2. **`BOT_AUTONOMY_LOOP.md`** — Workflow steps
3. **`VALIDATION_CHECKLIST.md`** — Test procedures
4. **`package.json`** — npm scripts
5. **`jest.config.js`** — Test configuration
6. **`playwright.config.ts`** — E2E test config
7. **`.github/workflows/deploy.yml`** — CI/CD pipeline

---

## 💡 Pro Tips

- **Parallel operations**: Run `npm run test` in one terminal while editing next file
- **Quick feedback**: Use `npm run lint` before committing to catch errors early
- **Git workflow**: Keep commits focused (one task per commit)
- **Validation first**: Always validate before marking [x] DONE
- **Atomic commits**: Each commit should be independently testable

---

**Next Bot: You're ready to continue from HIGH-02. Start by reading PRODUCTION_TASKS.md and finding the first `[ ]` (unchecked) task. Good luck! 🚀**
