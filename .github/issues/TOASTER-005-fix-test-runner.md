# 🍞 TOASTER-005: Fix Test Runner

**Priority:** P0 (Critical)
**Time Estimate:** 0.5 day
**Depends On:** None

---

## 📋 Problem

Tests fail with error:
```
Error: Initiated Worker with invalid NODE_OPTIONS env variable: 
--openssl-config= is not allowed in NODE_OPTIONS
```

---

## 🔍 Investigation Steps

### Step 1: Check Environment

```bash
# Check what's setting NODE_OPTIONS
env | grep NODE_OPTIONS

# Check shell profile
grep -r "NODE_OPTIONS" ~/.bashrc ~/.zshrc ~/.profile

# Check project files
grep -r "NODE_OPTIONS" . --include="*.json" --include="*.sh"
```

### Step 2: Try Running Without NODE_OPTIONS

```bash
# Unset and run
unset NODE_OPTIONS && npm test

# Or inline
NODE_OPTIONS= npm test
```

### Step 3: Check Vitest Config

Look at `vitest.config.ts` for worker configuration.

---

## 🔧 Potential Fixes

### Fix Option 1: Use Forks Instead of Threads

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'forks',  // Use forks instead of threads
  },
});
```

### Fix Option 2: Single Thread Mode

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
```

### Fix Option 3: Clear NODE_OPTIONS in Test Script

```json
// package.json
{
  "scripts": {
    "test": "NODE_OPTIONS= vitest",
    "test:ui": "NODE_OPTIONS= vitest --ui"
  }
}
```

### Fix Option 4: Use VM Forks

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'vmForks',
  },
});
```

---

## ✅ Acceptance Criteria

- [ ] `npm test` runs without NODE_OPTIONS error
- [ ] All existing tests pass
- [ ] Tests run in reasonable time (<60s)
- [ ] CI pipeline can run tests

---

## 📝 Document the Fix

Once fixed, add to `CONTRIBUTING.md`:

```markdown
## Running Tests

If you encounter NODE_OPTIONS errors, run:
```bash
unset NODE_OPTIONS && npm test
```

Or add to your shell profile:
```bash
alias npm-test="NODE_OPTIONS= npm test"
```
```

---

## 🏷️ Labels

`toaster` `priority-p0` `testing` `bug`

