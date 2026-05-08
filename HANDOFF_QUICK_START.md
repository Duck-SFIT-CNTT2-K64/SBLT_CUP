# 🤖 How to Hand Off to Another Bot Agent

## Quick Summary

You've completed **6/22 tasks (27.3%)**. Here's how to delegate the remaining work:

---

## **Option 1: Invoke via Subagent (Recommended)**

Use the Copilot Chat subagent feature to run an autonomous bot:

```
Use the runSubagent tool with this configuration:

Agent Name: "Explore" (or custom bot if available)
Task Description: "Continue TFT project production deployment loop"
Detailed Prompt:

---
You are an autonomous bot continuing a 22-task production deployment loop for the TFT SBLT CUP project.

**Current Status**: 6/22 tasks complete (CRITICAL-01 through HIGH-01)

**Your Mission**: Complete remaining 16 tasks (HIGH-02 through LOW-04)

**Execution Framework**:
- Location: d:\no_toc\tft-giai-dau
- Task list: PRODUCTION_TASKS.md (marks progress here)
- Workflow: BOT_AUTONOMY_LOOP.md (8-step loop)
- Validation: VALIDATION_CHECKLIST.md (test procedures)
- Handoff Guide: BOT_HANDOFF_GUIDE.md (this document)

**Loop Workflow** (repeat for each task):
1. INITIALIZE: Read PRODUCTION_TASKS.md, BOT_AUTONOMY_LOOP.md
2. FIND NEXT: grep "^\- \[ \]" PRODUCTION_TASKS.md | head -1
3. CHECK BLOCKERS: Skip if blocked, move to next
4. UNDERSTAND: Read full task description (Title, Acceptance, Files)
5. IMPLEMENT: Make code changes to specified files
6. VALIDATE: Run tests/checks from VALIDATION_CHECKLIST.md
7. MARK: Change "- [ ]" to "- [x]" in PRODUCTION_TASKS.md
8. COMMIT: git add, git commit -m "[TASK-ID] Title", git push origin master
9. LOOP: Repeat from step 2

**Rules**:
- ALWAYS validate before marking done
- ALWAYS git push after each commit
- STOP if: 3+ test failures, git conflicts, security issue, blocked task
- Use BOT_AUTONOMY_LOOP.md → Self-Debug section if stuck

**Expected Outcome**:
- All 22 tasks marked [x] in PRODUCTION_TASKS.md
- 22 git commits on master branch
- npm run test → All pass
- npm run build → 0 errors
- curl http://localhost:3000/api/health → 200

Start execution by reading PRODUCTION_TASKS.md and finding first unchecked task (should be HIGH-02).
---
```

---

## **Option 2: Run via Custom Agent**

Create a custom agent in VS Code:

1. Create file: `.instructions.md` in workspace root
2. Add loop instructions (copy from BOT_HANDOFF_GUIDE.md)
3. Enable agent in VS Code settings
4. Invoke agent and it will execute the loop

---

## **Option 3: Manual Bot Execution Template**

If you want to create a bot manually, give it these files:

```
START WITH THESE 4 FILES:
1. BOT_HANDOFF_GUIDE.md (this file) — Overview
2. PRODUCTION_TASKS.md — Current task list  
3. BOT_AUTONOMY_LOOP.md — Step-by-step workflow
4. VALIDATION_CHECKLIST.md — Validation procedures
```

Then provide this prompt:

```
Begin autonomous 8-step loop iteration.
Follow BOT_AUTONOMY_LOOP.md exactly.
Current iteration: #7 (starting HIGH-02)
Task counter: 6 complete, 16 remaining, 22 total
```

---

## **What's Already Done**

✅ **Framework Created**:
- `BOT_AUTONOMY_LOOP.md` — Complete 8-step workflow
- `PRODUCTION_TASKS.md` — 22 tasks with status tracking
- `VALIDATION_CHECKLIST.md` — Test procedures for each task
- `BOT_LOOP_PROMPT.md` — System prompt for autonomy

✅ **Code Changes Made** (6 tasks):
- GitHub Actions test gate + deploy blocking
- ADMIN_EMAILS validation
- Prisma error handler (all critical codes)
- Request logging middleware
- E2E test framework (Playwright)

✅ **Git History**: 6 commits (one per task), all pushed to master

---

## **Progress Tracker**

```
COMPLETED (6/22):
✅ CRITICAL-01: GitHub Actions test gate
✅ CRITICAL-02: ADMIN_EMAILS validation  
✅ CRITICAL-03: Prisma error codes
✅ CRITICAL-04: Deploy branch safety check
✅ CRITICAL-05: Request logging middleware
✅ HIGH-01: E2E Playwright framework

REMAINING (16/22):
⬜ HIGH-02: Tournament E2E tests
⬜ HIGH-03: Integration tests
⬜ HIGH-04: Sentry sampling rates
⬜ HIGH-05: Jest coverage thresholds
⬜ HIGH-06: Prisma query logging
⬜ HIGH-07: Audit logging middleware
⬜ MEDIUM-01 through MEDIUM-06 (6 tasks)
⬜ LOW-01 through LOW-04 (4 tasks)
```

---

## **Invocation Command for Next Bot**

### Via Subagent:
```
runSubagent(
  agentName: "Explore",
  description: "Continue TFT production deployment loop",
  prompt: "[See Option 1 above — full prompt]"
)
```

### Via Terminal:
```bash
# After creating the bot, in VS Code terminal:
# The bot will have instructions to cd into workspace and:

cd d:\no_toc\tft-giai-dau
git pull origin master
# [Bot executes loop]
```

---

## **Key Commands Bot Will Use**

```bash
# Find next task
grep "^\- \[ \]" PRODUCTION_TASKS.md | head -1

# Run tests
npm run test

# Build check
npm run build

# Git operations
git add [files]
git commit -m "[TASK-ID] Description"
git push origin master

# Git log (verify commits)
git log --oneline | head -10

# API health check
curl http://localhost:3000/api/health
```

---

## **Troubleshooting for Next Bot**

If next bot encounters issues:

**Check 1**: Read `BOT_AUTONOMY_LOOP.md` → Self-Debug section
**Check 2**: Review `VALIDATION_CHECKLIST.md` for similar task validations
**Check 3**: Look at git log of completed tasks (`git log --oneline`)
**Check 4**: Escalate with error message + git status output

---

## ✅ Ready to Handoff!

The project is configured for autonomous execution. Next bot can start immediately by:

1. Reading this file (BOT_HANDOFF_GUIDE.md)
2. Reading PRODUCTION_TASKS.md to find first `[ ]` task
3. Following 8-step loop from BOT_AUTONOMY_LOOP.md
4. Repeating until all 22 tasks marked `[x]`

**Estimated time for next bot**: 10-15 hours for 16 remaining tasks
**Estimated commits**: 16 more (total 22 when complete)
**Success criteria**: All tests pass, 0 build errors, production ready

---

**Good luck, next bot! 🚀**
