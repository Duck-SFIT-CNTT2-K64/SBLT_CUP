# 🤖 BOT AUTONOMY LOOP — Self-Directed Task Execution

**Purpose**: Guide bot to work autonomously through the task list, validate work, and self-debug.

---

## 🔄 THE LOOP ALGORITHM

```
START
  ↓
[1] Read PRODUCTION_TASKS.md
  ↓
[2] Find first [ ] (incomplete) task
  ↓
[3] Check if all blockers [x] (complete)
      ↓ YES → Continue to [4]
      ↓ NO → Skip to next task, go to [2]
  ↓
[4] Read task description + acceptance criteria
  ↓
[5] EXECUTE TASK
      [5a] Implement code changes
      [5b] Run local validation (npm run dev, npm run test)
      [5c] If fails → Self-debug using [SELF-DEBUG SECTION]
      [5d] If passes → Continue to [6]
  ↓
[6] Run formal validation from VALIDATION_CHECKLIST.md
      ↓ PASS → Go to [7]
      ↓ FAIL → Go to [SELF-DEBUG SECTION]
  ↓
[7] Mark task [x] COMPLETE in PRODUCTION_TASKS.md
  ↓
[8] Git commit with message: "[Task ID] — Brief description"
  ↓
[9] Loop back to [1]
  ↓
[ ] All tasks [x] complete?
      ↓ YES → ALL DONE, GO TO PRODUCTION ✅
      ↓ NO → Back to [1]
END
```

---

## 🚀 STEP-BY-STEP FOR BOT

### **LOOP ITERATION STARTS HERE**

```
================================================================================
ITERATION N: [2026-05-09 10:00:00]
================================================================================

[1] READ TASKS
    $ cat PRODUCTION_TASKS.md | grep "^\- \[ \]" | head -1
    
    Output: - [ ] **CRITICAL-01** | 🔴 P0 | `TODO` | **CI/CD** | Bot

[2] GET TASK DETAILS
    Task: CRITICAL-01
    Title: Add tests to GitHub Actions deploy pipeline
    Files: .github/workflows/deploy.yml
    Effort: 0.5h
    Blockers: None
    
[3] CHECK BLOCKERS
    Blockers: None → PROCEED ✅

[4] UNDERSTAND REQUIREMENT
    Read: .github/workflows/deploy.yml
    Goal: Add test job before deploy
    Acceptance: Tests run on every push main, deploy blocks if tests fail

[5] EXECUTE TASK

    [5a] IMPLEMENT
         $ cat > .github/workflows/deploy.yml << 'EOF'
         name: Deploy

         on:
           push:
             branches: [main]
           workflow_dispatch:

         jobs:
           test:
             name: Run Tests
             runs-on: ubuntu-latest
             steps:
               - uses: actions/checkout@v4
               - uses: actions/setup-node@v4
               - run: npm ci
               - run: npm run test
               - run: npm run build

           deploy:
             name: Deploy to Production
             runs-on: ubuntu-latest
             needs: test
             if: success()
             steps:
               ...
         EOF
    
    [5b] LOCAL VALIDATION
         $ npm run test
         Output: ✅ 41 tests pass
         
         $ npm run build
         Output: ✅ Build successful
    
    [5c] IF FAILED → Self-debug (see section below)
         Not applicable - passed ✅
    
    [5d] PASSED → Continue

[6] FORMAL VALIDATION (from VALIDATION_CHECKLIST.md)
    
    $ grep -A 10 "^jobs:" .github/workflows/deploy.yml | grep -q "test:"
    Output: ✅ FOUND
    
    $ grep "needs: test" .github/workflows/deploy.yml
    Output: ✅ FOUND
    
    Validation: ✅ PASS

[7] MARK COMPLETE
    $ sed -i 's/- \[ \] \*\*CRITICAL-01\*\*/- [x] **CRITICAL-01**/' PRODUCTION_TASKS.md

[8] GIT COMMIT
    $ git add .github/workflows/deploy.yml
    $ git commit -m "[CRITICAL-01] Add tests to GitHub Actions deploy pipeline"
    $ git push origin main
    Output: ✅ Pushed

[9] LOOP BACK
    Go to [1] for next task

================================================================================
```

---

## 🛠️ SELF-DEBUG SECTION

**Used when validation fails in step [5c] or [6]**

### Format: **Problem → Diagnostic → Fix**

---

### **Problem: Tests Fail**

```
Diagnostic:
  $ npm run test 2>&1 | tail -20
  → Shows which test failed and why

Steps:
  1. Read test error message carefully
  2. Go to test file mentioned
  3. Check if it's your code change or pre-existing test
  4. Fix code or update test
  5. Re-run: npm run test
  6. Repeat until pass
  
Example:
  Error: "Prisma error handler missing P2003 case"
  → Go to src/lib/api-error.ts
  → Add case "P2003": ...
  → Run test again
  → Should pass now
```

---

### **Problem: Build Fails**

```
Diagnostic:
  $ npm run build 2>&1 | grep -i error
  
Steps:
  1. Check if TypeScript error (type mismatch)
  2. Check if import error (file not found)
  3. Check if syntax error (bracket, quote)
  4. Fix file
  5. Re-run: npm run build
  
Example:
  Error: "Cannot find module './api-error'"
  → File doesn't exist or wrong path
  → Check src/lib/api-error.ts exists
  → Check import path is relative: ../lib/api-error
  → Fix and rebuild
```

---

### **Problem: Validation Check Fails**

```
Diagnostic:
  1. Re-read the validation step from VALIDATION_CHECKLIST.md
  2. Run the exact same grep/test command
  3. Compare actual vs expected output

Steps:
  1. Understand what the validation checks
  2. Manually verify in code: cat filename | grep pattern
  3. If not found, implement the feature
  4. Re-run validation
  
Example:
  Validation expects: grep -q "needs: test" .github/workflows/deploy.yml
  Actual result: (no output)
  → Open .github/workflows/deploy.yml
  → Check if "needs: test" exists under deploy job
  → If not, add it: needs: test
  → Re-run grep
```

---

### **Problem: File Doesn't Exist**

```
Diagnostic:
  $ test -f path/to/file && echo "EXISTS" || echo "NOT FOUND"
  
Steps:
  1. Create file if it doesn't exist
  2. Add required content
  3. Re-validate
  
Example:
  Task needs: src/__tests__/e2e/auth.e2e.test.ts
  Actual: File doesn't exist
  → Create: mkdir -p src/__tests__/e2e
  → Create file with test template
  → npm run test -- auth.e2e
```

---

### **Problem: Git Push Fails**

```
Diagnostic:
  $ git push origin main 2>&1
  
Steps:
  1. Check if conflict: git status
  2. Check if remote updated: git pull origin main
  3. Resolve conflicts if any
  4. Re-push: git push origin main
  
Example:
  Error: "rejected ... non-fast-forward"
  → Someone else pushed to main
  → git pull origin main
  → Merge locally
  → git push origin main
```

---

### **Problem: API Test Fails**

```
Diagnostic:
  $ curl http://localhost:3000/api/health 2>&1
  
Steps:
  1. Check server running: npm run dev
  2. Check endpoint exists
  3. Check response format matches expectations
  
Example:
  Expected: {"status":"ok","database":"connected"}
  Actual: {"error":"connection failed"}
  → Database not running
  → Check DATABASE_URL env var
  → Restart dev server
```

---

## 📋 QUICK REFERENCE COMMANDS

**For Bot to use**:

```bash
# Check what task to do next
grep "^\- \[ \]" PRODUCTION_TASKS.md | head -1

# Read task details
grep -A 10 "CRITICAL-01" PRODUCTION_TASKS.md

# Run all tests
npm run test

# Run specific test
npm run test -- auth

# Build check
npm run build

# Health check
curl http://localhost:3000/api/health

# Check git status
git status

# Commit and push
git add -A
git commit -m "[TASK-ID] Description"
git push origin main

# Quick validation
bash < (cat VALIDATION_CHECKLIST.md | sed -n '/^## 🎯/,$p')

# Update task status
sed -i 's/- \[ \] \*\*TASK-ID\*\*/- [x] **TASK-ID**/' PRODUCTION_TASKS.md
```

---

## 🚨 SAFETY GUARDRAILS

**Bot MUST STOP if**:

1. ❌ More than 3 consecutive validation failures
   - Escalate to human: "Cannot resolve after 3 attempts. Manual review needed."

2. ❌ Task has no blockers but > 5 attempts to complete
   - Escalate: "Task seems blocked by external dependency or requires redesign."

3. ❌ Git push fails > 2 times
   - Escalate: "Git conflicts or permission issues. Manual intervention needed."

4. ❌ Database/external service down
   - Wait 5 min, retry, then escalate if still down.

5. ❌ New error/bug discovered not in PRODUCTION_TASKS.md
   - Stop and create new task instead of hacking around it.

---

## 🏁 SUCCESS CRITERIA FOR BOT

**Bot has succeeded when**:

✅ All 22 tasks marked `[x]` in PRODUCTION_TASKS.md  
✅ `npm run test` shows 41+ tests pass  
✅ `npm run build` succeeds with 0 errors  
✅ `curl http://localhost:3000/api/health` returns 200  
✅ All `.github/workflows/deploy.yml` validations pass  
✅ `git log --oneline | head -22` shows commits for all tasks  
✅ README updated with production instructions  
✅ No TODOs or FIXMEs in critical files  

**Then**:
```
🚀 PRODUCTION READY
Ready to: git push origin main → Deploy workflow runs → App goes live
```

---

## 📝 EXAMPLE: BOT COMPLETING ONE FULL ITERATION

```
================================================================================
BOT ITERATION LOG: 2026-05-09 10:00:00 - 10:35:00
================================================================================

[10:00] Reading tasks...
[10:01] Found first incomplete: CRITICAL-01
[10:02] Blockers: None ✅
[10:03] Implementing: Update .github/workflows/deploy.yml
[10:05] Local test: npm run test → PASS ✅
[10:06] Local build: npm run build → PASS ✅
[10:07] Formal validation from VALIDATION_CHECKLIST.md → PASS ✅
[10:08] Marking [x] CRITICAL-01 in PRODUCTION_TASKS.md
[10:09] Committing: [CRITICAL-01] Add tests to GitHub Actions deploy pipeline
[10:10] Pushing to origin/main
[10:15] Next task: CRITICAL-02
[10:16] Blockers: None ✅
[10:17] Implementing: Validate ADMIN_EMAILS in env.ts
[10:22] Local test: npm run test → PASS ✅
[10:23] Formal validation → PASS ✅
[10:24] Committing and pushing
...
[10:35] Summary: 2 tasks completed today
        Progress: 2/22 (9%)
        Next: CRITICAL-03

[READY FOR NEXT ITERATION]
================================================================================
```

---

## 🔄 HUMAN OVERSIGHT CHECKPOINTS

**Human should review at these points**:

- ✅ After every 5 completed tasks: Review progress + quality
- ✅ Before any security-related task (CRITICAL-02, CRITICAL-03, CRITICAL-05)
- ✅ Before deploying to production: Manual smoke test
- ✅ If bot escalates (> 3 failures): Manual debug + fix

**Human can intervene**:
- `git reset --hard HEAD~1` if bot made mistake
- Update task priority if requirements change
- Add comments to tasks if blocked or need clarification

---

