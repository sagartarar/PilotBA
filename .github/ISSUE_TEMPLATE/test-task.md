---
name: Test Task
about: Testing task for Toaster (Senior QA) to implement
title: '[TEST] '
labels: 'testing, toaster, status: todo'
assignees: ''
---

## Test Objective

**What to test:**
[Clear description of what needs testing]

**Test type:**
- [ ] E2E Test (Playwright)
- [ ] Integration Test
- [ ] Performance Test
- [ ] Security Test
- [ ] Accessibility Test (WCAG 2.1 AA)
- [ ] Cross-browser Test
- [ ] Load Test
- [ ] Other: [specify]

**Related feature/bug:**
- Implements feature: #[issue number]
- Tests fix for bug: #[issue number]
- Related to: #[issue number]

---

## Test Scope

**Components to test:**
- [ ] Component 1: [name]
- [ ] Component 2: [name]
- [ ] Component 3: [name]

**User flows to cover:**
1. Flow 1: [description]
2. Flow 2: [description]
3. Flow 3: [description]

**Edge cases to test:**
- [ ] Empty data
- [ ] Large dataset (1M+ rows)
- [ ] Invalid input
- [ ] Network failure
- [ ] Concurrent operations
- [ ] Other: [specify]

---

## Acceptance Criteria

- [ ] All critical paths tested
- [ ] Edge cases covered
- [ ] Tests are stable (not flaky)
- [ ] Tests pass on all target browsers (if E2E)
- [ ] Performance targets validated (if applicable)
- [ ] Accessibility validated (if UI test)
- [ ] Tests documented with clear descriptions
- [ ] Tests added to CI/CD pipeline

---

## Test Scenarios

### Scenario 1: [Name]

**Given:** [Initial state]
**When:** [Action taken]
**Then:** [Expected outcome]

**Test steps:**
1. Step 1
2. Step 2
3. Step 3

**Expected results:**
- [ ] Result 1
- [ ] Result 2
- [ ] Result 3

---

### Scenario 2: [Name]

**Given:** [Initial state]
**When:** [Action taken]
**Then:** [Expected outcome]

**Test steps:**
1. Step 1
2. Step 2
3. Step 3

**Expected results:**
- [ ] Result 1
- [ ] Result 2
- [ ] Result 3

---

### Scenario 3: [Name]

**Given:** [Initial state]
**When:** [Action taken]
**Then:** [Expected outcome]

**Test steps:**
1. Step 1
2. Step 2
3. Step 3

**Expected results:**
- [ ] Result 1
- [ ] Result 2
- [ ] Result 3

---

## Test Data Requirements

**Test data needed:**
- [ ] Mock data: [description]
- [ ] Fixtures: [files needed]
- [ ] Test database: [schema/data]
- [ ] External services to mock: [list]

**Data generation:**
```typescript
// Example test data structure
const testData = {
  // ...
};
```

---

## Performance Targets (if applicable)

| Metric | Target | Test Method |
|--------|--------|-------------|
| Load time | [e.g., < 2s] | Lighthouse |
| Response time | [e.g., < 500ms] | Network logs |
| FPS | [e.g., 60 FPS] | Performance API |
| Memory | [e.g., < 500MB] | Chrome DevTools |

---

## Browser Coverage (for E2E)

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (Pixel 5)
- [ ] Mobile Safari (iPhone 12)

---

## Accessibility Checklist (if applicable)

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Form validation accessible
- [ ] Error messages announced
- [ ] Zoom to 200% works

---

## Implementation Plan (for Toaster)

### File to create/update:
```
# E2E Test
e2e/[feature-name].spec.ts

# Integration Test
frontend/src/test/integration/[feature].test.ts
backend/tests/integration/[feature]_tests.rs

# Performance Test
scripts/performance-test.sh
```

### Test structure:
```typescript
describe('[Feature Name]', () => {
  beforeEach(async ({ page }) => {
    // Setup
  });

  test('should [test scenario 1]', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });

  test('should [test scenario 2]', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });

  afterEach(async ({ page }) => {
    // Cleanup
  });
});
```

**Estimated effort:** [Small (< 2 hours) | Medium (2-4 hours) | Large (1 day) | XL (2+ days)]

---

## Flakiness Prevention

- [ ] Use explicit waits (not timeouts)
- [ ] Use stable selectors (data-testid)
- [ ] Avoid timing dependencies
- [ ] Clean up test data
- [ ] Mock external dependencies
- [ ] Retry flaky operations appropriately

---

## CI/CD Integration

**Where to add tests:**
- [ ] `.github/workflows/test.yml` (main test suite)
- [ ] `.github/workflows/performance.yml` (performance tests)
- [ ] `.github/workflows/codeql.yml` (security tests)

**Run frequency:**
- [ ] On every commit
- [ ] On PR only
- [ ] Nightly
- [ ] Weekly

---

## Dependencies

**Blocked by:**
- [ ] Feature implementation: #[issue number]
- [ ] Test infrastructure: #[issue number]
- [ ] Other: [specify]

**Depends on:**
- [ ] Mock data creation
- [ ] Test fixtures
- [ ] Backend running
- [ ] Database seeded

---

## Verification Checklist

- [ ] Tests written and documented
- [ ] Tests pass locally
- [ ] Tests pass in CI/CD
- [ ] No flaky behavior observed (run 10+ times)
- [ ] All scenarios covered
- [ ] Edge cases tested
- [ ] Performance targets met (if applicable)
- [ ] Accessibility validated (if applicable)
- [ ] Cross-browser tested (if E2E)
- [ ] Test code reviewed
- [ ] Test documentation updated

---

## Test Results

**After implementation, fill this out:**

**Test files added:**
- [ ] `e2e/[file].spec.ts`
- [ ] `frontend/src/[file].test.ts`
- [ ] `backend/tests/[file].rs`

**Coverage impact:**
- Before: [%]
- After: [%]
- Increase: [%]

**Performance results:**
| Metric | Target | Actual | Pass |
|--------|--------|--------|------|
| Metric 1 | [target] | [actual] | ✅/❌ |
| Metric 2 | [target] | [actual] | ✅/❌ |

**Issues found:**
- Issue 1: [create new bug report if needed]
- Issue 2: [create new bug report if needed]

---

## Notes

[Any additional context, challenges encountered, or recommendations]

---

**Labels:** `testing`, `toaster`, `status: todo`, `type: [e2e|integration|performance|security|accessibility]`, `priority: [high|medium|low]`

**Assigned to:** Toaster (Senior QA)
**Reviewed by:** Project Architect
**Depends on:** Handyman (for feature completion)

