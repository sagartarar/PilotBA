# 🧹 CLEANUP-001: Deduplicate Test Runner Issues

**Priority:** P1 (High)
**Assignee:** Toaster (owns test-related issues)
**Time Estimate:** 15 minutes
**Date:** December 18, 2025

---

## 📋 Problem

Three separate files address the **same** NODE_OPTIONS test runner error:

| File | Issue |
|------|-------|
| `TOASTER-003-fix-test-runner.md` | Dedicated issue (basic) |
| `TOASTER-005-fix-test-runner.md` | Dedicated issue (comprehensive) |
| `TOASTER-004-phase6-testing.md` | Section 1 duplicates this task |

This creates:
- ❌ Confusion about canonical issue
- ❌ Duplicated work tracking
- ❌ Potential for inconsistent resolution

---

## ✅ Resolution Steps

### Step 1: Delete `TOASTER-003-fix-test-runner.md`

```bash
cd /u/tarar/PilotBA
git rm .github/issues/TOASTER-003-fix-test-runner.md
```

**Reason:** `TOASTER-005` is more comprehensive with better investigation steps.

---

### Step 2: Update `TOASTER-004-phase6-testing.md`

Remove Section 1 (lines 18-47) which duplicates the NODE_OPTIONS fix.

**Replace Section 1 with:**

```markdown
### 1. Verify Test Runner Works (After TOASTER-005)

**Prerequisite:** TOASTER-005 must be completed first.

**Verification:**
```bash
cd frontend
npm test
npm run test:coverage
```

**Expected:** All tests run without NODE_OPTIONS errors.

> **Note:** The NODE_OPTIONS fix is tracked in TOASTER-005. Do not duplicate work here.
```

---

### Step 3: Commit Changes

```bash
git add -A
git commit -m "chore: deduplicate test runner issues (CLEANUP-001)

- Remove TOASTER-003 (superseded by TOASTER-005)
- Update TOASTER-004 to reference TOASTER-005 instead of duplicating
- Canonical issue for NODE_OPTIONS fix is now TOASTER-005"
git push origin main
```

---

## 📊 Issue Numbering After Cleanup

| Issue ID | Description | Status |
|----------|-------------|--------|
| TOASTER-001 | Component Tests | Active |
| TOASTER-002 | E2E Tests | Active |
| TOASTER-003 | ~~Fix Test Runner~~ | **DELETED** |
| TOASTER-004 | Phase 6 Testing | Active (updated) |
| TOASTER-005 | Fix Test Runner (Canonical) | **ACTIVE** |
| TOASTER-006 | Performance Benchmarks | Active |
| TOASTER-007 | E2E Critical Paths | Active |

---

## ✅ Definition of Done

- [ ] `TOASTER-003-fix-test-runner.md` deleted
- [ ] `TOASTER-004-phase6-testing.md` updated to reference TOASTER-005
- [ ] Changes committed and pushed
- [ ] No duplicate NODE_OPTIONS issues remain

---

## 🏷️ Labels

`toaster` `cleanup` `priority-p1` `documentation`

