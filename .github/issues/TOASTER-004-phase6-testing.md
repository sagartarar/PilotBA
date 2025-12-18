# 🍞 TOASTER-004: Phase 6 - Testing & QA

**Assignee:** Toaster (Senior QA)
**Priority:** High
**Phase:** 6 - Polish & Optimization
**Estimated Effort:** 1-2 days

---

## 📋 Overview

After Handyman completes the Phase 6 fixes, verify all changes work correctly and add tests for the new functionality.

---

## ✅ Task Checklist

### 1. Verify Test Runner Works (After TOASTER-005) ✅

**Prerequisite:** TOASTER-005 must be completed first.

**Status:** ✅ COMPLETED (December 18, 2025)

The NODE_OPTIONS fix has been applied in `vitest.config.ts` using fork pool:
```typescript
pool: 'forks',
poolOptions: {
  forks: {
    singleFork: true,
  },
},
```

**Verification:**
```bash
cd frontend
unset NODE_OPTIONS && npm test
```

**Result:** All tests run without NODE_OPTIONS errors.

> **Note:** The NODE_OPTIONS fix is tracked in TOASTER-005. See `docs/TOASTER_FINAL_QA_REPORT_2025-12-18.md` for details.

---

### 2. Verify TypeScript Fixes

After Handyman completes fixes, verify:

```bash
cd frontend

# All should pass
npm run type-check
npm run build
npm run lint
```

---

### 3. Add Unit Tests for Fixed Components

**Components that need tests after fixes:**

| Component | Test File | Tests Needed |
|-----------|-----------|--------------|
| `HeatMap.ts` | `HeatMap.test.ts` | render(), destroy(), color maps |
| `Renderer.ts` | `Renderer.test.ts` | getGL(), getContext() |
| `SkeletonLoader.tsx` | `SkeletonLoader.test.tsx` | style prop |
| `ErrorBoundary.tsx` | `ErrorBoundary.test.tsx` | error catching, reset |

---

### 4. Performance Testing

**Run performance benchmarks:**

```bash
# Build and analyze bundle
npm run build
npx vite-bundle-analyzer

# Run Lighthouse
npx lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

**Targets:**
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Total Blocking Time | < 200ms |
| Cumulative Layout Shift | < 0.1 |

---

### 5. Accessibility Testing

**Manual testing checklist:**

- [ ] Tab through entire app - focus visible?
- [ ] Screen reader announces all content?
- [ ] Color contrast passes?
- [ ] All images have alt text?
- [ ] Forms have labels?

**Automated testing:**
```bash
# Run axe-core
npx @axe-core/cli http://localhost:3000
```

---

### 6. Responsive Testing

**Test at these widths:**
- 320px (iPhone SE)
- 375px (iPhone 12)
- 768px (iPad)
- 1024px (iPad Pro)
- 1440px (Desktop)

**Checklist per breakpoint:**
- [ ] Layout doesn't break
- [ ] Text is readable
- [ ] Buttons are tappable (44px min)
- [ ] No horizontal scroll
- [ ] Charts resize properly

---

### 7. Cross-Browser Testing

**Browsers to test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Key features to verify:**
- File upload (drag & drop)
- WebGL charts
- CSS animations
- Flexbox/Grid layouts

---

## 📊 Test Coverage Report

After all tests pass, generate coverage:

```bash
npm run test:coverage
```

**Target:** 80%+ coverage on:
- Components
- Hooks
- Store
- Data pipeline

---

## 🏷️ Labels

`toaster` `phase-6` `testing` `priority-high` `qa`

