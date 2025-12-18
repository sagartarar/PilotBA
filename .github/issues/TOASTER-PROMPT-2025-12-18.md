# 🍞 TOASTER: Daily Tasks - December 18, 2025

**Date:** December 18, 2025
**Agent:** Toaster (Senior QA)
**Status:** Ready to Start

---

## 📋 Today's Priority Order

Complete these tasks in order:

| # | Issue | Priority | Time | Description |
|---|-------|----------|------|-------------|
| 1 | **CLEANUP-001** | P1 | 15 min | Deduplicate test runner issues |
| 2 | **TOASTER-005** | P0 | 30 min | Fix NODE_OPTIONS test runner error |
| 3 | **TOASTER-006** | P1 | 2 hrs | Performance benchmarks |
| 4 | **TOASTER-007** | P2 | 2 hrs | E2E tests for critical paths |

---

## 🔴 Task 1: CLEANUP-001 - Deduplicate Issues (START HERE)

**File:** `.github/issues/CLEANUP-001-deduplicate-issues.md`

### Quick Steps:

```bash
# 1. Navigate to project
cd /u/tarar/PilotBA

# 2. Delete the duplicate issue
git rm .github/issues/TOASTER-003-fix-test-runner.md

# 3. Edit TOASTER-004 to remove Section 1 (lines 18-47)
# Replace with reference to TOASTER-005

# 4. Commit
git add -A
git commit -m "chore: deduplicate test runner issues (CLEANUP-001)

- Remove TOASTER-003 (superseded by TOASTER-005)
- Update TOASTER-004 to reference TOASTER-005 instead of duplicating
- Canonical issue for NODE_OPTIONS fix is now TOASTER-005"

# 5. Push
git push origin main
```

**Definition of Done:**
- [ ] `TOASTER-003-fix-test-runner.md` deleted
- [ ] `TOASTER-004-phase6-testing.md` Section 1 updated
- [ ] Changes pushed to main

---

## 🔴 Task 2: TOASTER-005 - Fix Test Runner (CRITICAL)

**File:** `.github/issues/TOASTER-005-fix-test-runner.md`

### The Problem:

```
Error: Initiated Worker with invalid NODE_OPTIONS env variable: 
--openssl-config= is not allowed in NODE_OPTIONS
```

### Recommended Fix (Option 3 - Quickest):

**Edit `frontend/package.json`:**

```json
{
  "scripts": {
    "test": "NODE_OPTIONS= vitest",
    "test:ui": "NODE_OPTIONS= vitest --ui",
    "test:coverage": "NODE_OPTIONS= vitest --coverage"
  }
}
```

### Verification:

```bash
cd /u/tarar/PilotBA/frontend
source ../nodeenv/bin/activate
npm test
```

**Expected:** Tests run without NODE_OPTIONS error.

**Definition of Done:**
- [ ] `npm test` runs without error
- [ ] All existing tests pass
- [ ] Fix committed and pushed

---

## 🟡 Task 3: TOASTER-006 - Performance Benchmarks

**File:** `.github/issues/TOASTER-006-performance-benchmarks.md`

After test runner is fixed, run performance benchmarks:

```bash
cd /u/tarar/PilotBA/frontend
npm run build
npx vite-bundle-analyzer

# Lighthouse audit
npm run dev &
npx lighthouse http://localhost:5173 --output html --output-path ./lighthouse-report.html
```

**Targets:**
| Metric | Target |
|--------|--------|
| Bundle Size | < 300KB gzipped |
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3.5s |

---

## 🟡 Task 4: TOASTER-007 - E2E Critical Paths

**File:** `.github/issues/TOASTER-007-e2e-critical-paths.md`

Write Playwright E2E tests for:
1. File upload flow (CSV → display)
2. Chart creation flow
3. Data filtering flow

---

## 📝 Commit Convention

Use this format for commits:

```
test(qa): <description>
fix(qa): <description>
chore: <description>
```

Examples:
- `chore: deduplicate test runner issues (CLEANUP-001)`
- `fix(qa): resolve NODE_OPTIONS error in vitest (TOASTER-005)`
- `test(qa): add performance benchmarks (TOASTER-006)`

---

## 🔗 Quick Links

- [CLEANUP-001](.github/issues/CLEANUP-001-deduplicate-issues.md)
- [TOASTER-005](.github/issues/TOASTER-005-fix-test-runner.md)
- [TOASTER-006](.github/issues/TOASTER-006-performance-benchmarks.md)
- [TOASTER-007](.github/issues/TOASTER-007-e2e-critical-paths.md)

---

## ❓ Questions?

If blocked, create a comment in the relevant issue file or ask Architect for guidance.

**Good luck, Toaster! 🍞**

