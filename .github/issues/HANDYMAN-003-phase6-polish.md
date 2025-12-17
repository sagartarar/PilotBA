# 🔧 HANDYMAN-003: Phase 6 - Polish & Optimization

**Assignee:** Handyman (Lead Developer)
**Priority:** High
**Phase:** 6 - Polish & Optimization
**Estimated Effort:** 2-3 days

---

## 📋 Overview

Phase 6 focuses on production readiness: fixing remaining TypeScript errors, performance optimization, accessibility, and responsive design polish.

---

## ✅ Task Checklist

### 1. TypeScript Error Fixes (CRITICAL - Do First)

The build is currently failing due to TypeScript errors. These must be fixed first.

**Files with errors (run `npm run build` to see full list):**

| File                                       | Issue                                                  | Fix Approach                                                                            |
| ------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `src/types/apache-arrow.d.ts`              | Missing type declarations                              | Add missing types: `Timestamp`, `RecordBatchReader`, `Schema.toJSON`, `Table.serialize` |
| `tsconfig.json`                            | Strict mode causing issues                             | Relax `noUnusedLocals`, `noUnusedParameters` temporarily                                |
| `src/viz-engine/charts/HeatMap.ts`         | Missing `render()` method, wrong `destroy()` signature | Implement abstract methods properly                                                     |
| `src/viz-engine/Renderer.ts`               | Missing `getGL()` and `getContext()` methods           | Add accessor methods                                                                    |
| `src/data-pipeline/operators/Filter.ts`    | Naming conflict: `FilterOperator` type and class       | Rename type to `FilterOperatorType`                                                     |
| `src/data-pipeline/operators/Compute.ts`   | Using `push` on Set                                    | Change to `add`                                                                         |
| `src/components/Query/QueryBuilder.tsx`    | Wrong imports from operators                           | Import `FilterOperator`, `AggregateOperator`, `SortOperator` classes                    |
| `src/components/common/SkeletonLoader.tsx` | Missing `style` prop                                   | Add `style?: React.CSSProperties` to props                                              |

**Commands to verify:**

```bash
cd frontend
npm run type-check  # Check TypeScript errors
npm run build       # Full production build
```

**Success Criteria:** `npm run build` completes without errors

---

### 2. Code Splitting & Lazy Loading

**Goal:** Reduce initial bundle size from 509KB to <300KB

**Implementation:**

```typescript
// src/App.tsx - Add lazy loading
import React, { Suspense, lazy } from "react";
import { LoadingSpinner } from "./components/common";

// Lazy load heavy components
const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const DatasetManager = lazy(() => import("./components/Data/DatasetManager"));
const QueryBuilder = lazy(() => import("./components/Query/QueryBuilder"));
const ChartContainer = lazy(() => import("./components/Chart/ChartContainer"));

// Wrap routes in Suspense
<Suspense fallback={<LoadingSpinner size="lg" label="Loading..." />}>
  <Dashboard />
</Suspense>;
```

**Files to modify:**

- `src/App.tsx` - Add lazy imports
- `src/components/Dashboard/Dashboard.tsx` - Export as default
- `src/components/Data/DatasetManager.tsx` - Export as default
- `src/components/Query/QueryBuilder.tsx` - Export as default

**Verification:**

```bash
npm run build
# Check output - should show multiple chunks
```

---

### 3. Memoization & Performance

**Goal:** Prevent unnecessary re-renders

**Files to optimize:**

| Component            | Optimization                                               |
| -------------------- | ---------------------------------------------------------- |
| `DataTable.tsx`      | Wrap with `React.memo`, memoize row rendering              |
| `ChartContainer.tsx` | Use `useMemo` for chart config, `useCallback` for handlers |
| `FilterBuilder.tsx`  | Memoize filter list rendering                              |
| `Dashboard.tsx`      | Memoize chart grid layout                                  |

**Pattern to follow:**

```typescript
// Memoize expensive computations
const processedData = useMemo(() => {
  return expensiveOperation(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(
  (id: string) => {
    // handler logic
  },
  [dependencies]
);

// Memoize components
export const DataTable = React.memo(({ data, columns }) => {
  // component logic
});
```

---

### 4. Accessibility (WCAG 2.1 AA)

**Checklist:**

- [ ] All interactive elements have `aria-label` or visible labels
- [ ] Focus states are visible (check all buttons, inputs)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Color contrast meets 4.5:1 ratio
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers

**Files to audit:**

- All components in `src/components/common/`
- `FileUploader.tsx` - Ensure drag-drop is keyboard accessible
- `DataTable.tsx` - Ensure table is navigable
- `ChartContainer.tsx` - Add chart description for screen readers

**Testing:**

```bash
# Install axe-core for accessibility testing
npm install -D @axe-core/react

# Add to App.tsx (dev only)
if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

---

### 5. Responsive Design Polish

**Breakpoints to test:**

- Mobile: 320px - 480px
- Tablet: 481px - 768px
- Desktop: 769px+

**Components to check:**

- `AppLayout.tsx` - Sidebar collapse on mobile
- `Dashboard.tsx` - Single column on mobile
- `DataTable.tsx` - Horizontal scroll on mobile
- `ChartContainer.tsx` - Full width on mobile

**CSS patterns:**

```css
/* Mobile-first approach */
.container {
  @apply flex flex-col gap-4;

  @screen md {
    @apply flex-row;
  }
}
```

---

### 6. Error Handling Improvements

**Add error boundaries around:**

- Chart rendering
- Data table
- File upload
- Query execution

**Pattern:**

```tsx
<ErrorBoundary
  fallback={<ErrorMessage message="Chart failed to render" onRetry={retry} />}
  onError={(error) => logError(error)}
>
  <ChartContainer />
</ErrorBoundary>
```

---

## 📊 Acceptance Criteria

| Metric                   | Target              | How to Verify            |
| ------------------------ | ------------------- | ------------------------ |
| Build                    | No errors           | `npm run build` succeeds |
| Bundle size              | < 300KB gzipped     | Check build output       |
| Lighthouse Performance   | > 80                | Run Lighthouse audit     |
| Lighthouse Accessibility | > 90                | Run Lighthouse audit     |
| Mobile responsive        | All components work | Manual testing at 320px  |

---

## 🔗 Dependencies

- None - can start immediately

---

## 📝 Notes for Handyman

1. **Start with TypeScript fixes** - Nothing else matters if build fails
2. **Test after each change** - Run `npm run build` frequently
3. **Don't over-optimize** - Focus on the biggest wins first
4. **Document any architectural decisions** - Create ADR if needed

---

## 🏷️ Labels

`handyman` `phase-6` `frontend` `priority-high` `polish`
