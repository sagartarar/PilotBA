# [TOASTER] Fix Test Runner NODE_OPTIONS Error

**Assigned to:** Toaster (Senior QA)  
**Date:** December 17, 2025  
**Priority:** Critical (Blocker)  
**Estimated Time:** 30 minutes  
**Labels:** `toaster`, `bug`, `testing`, `priority:critical`

---

## Problem Description

The test runner (Vitest) is failing with the following error:

```
Error: Initiated Worker with invalid NODE_OPTIONS env variable: 
--openssl-config= is not allowed in NODE_OPTIONS
```

This is blocking all unit tests from running.

---

## Root Cause

The `NODE_OPTIONS` environment variable contains `--openssl-config=` which is not allowed in worker threads. This is likely set by the system or nodeenv.

---

## Solution Options

### Option 1: Unset NODE_OPTIONS before running tests
**File:** `frontend/package.json`

```json
{
  "scripts": {
    "test": "unset NODE_OPTIONS && vitest",
    "test:coverage": "unset NODE_OPTIONS && vitest --coverage"
  }
}
```

### Option 2: Filter NODE_OPTIONS in vitest config
**File:** `frontend/vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    // Use single thread to avoid worker issues
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
```

### Option 3: Create wrapper script
**File:** `frontend/scripts/test.sh`

```bash
#!/bin/bash
# Unset problematic NODE_OPTIONS
unset NODE_OPTIONS
# Run vitest
npx vitest "$@"
```

---

## Tasks

- [ ] Identify which option works best
- [ ] Implement the fix
- [ ] Verify tests run successfully
- [ ] Update documentation if needed
- [ ] Commit fix with descriptive message

---

## Verification Steps

```bash
# After fix, these should work:
cd frontend
npm test
npm run test:coverage

# Expected output:
# ✓ All tests passing
# No NODE_OPTIONS errors
```

---

## Definition of Done
- [ ] Tests run without NODE_OPTIONS error
- [ ] All existing tests pass
- [ ] Fix committed and pushed
- [ ] Other team members can run tests

---

## References
- Error: `ERR_WORKER_INVALID_EXEC_ARGV`
- Node.js Worker Threads: https://nodejs.org/api/worker_threads.html
- Vitest Configuration: https://vitest.dev/config/

