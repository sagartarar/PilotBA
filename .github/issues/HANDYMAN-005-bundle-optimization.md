# 🔧 HANDYMAN-005: Bundle Optimization

**Priority:** P1
**Time Estimate:** 0.5 day
**Depends On:** None

---

## 📋 Objective

Reduce bundle size from 509KB to <300KB gzipped for faster load times.

---

## 📊 Current State

```
dist/assets/index-Bh9dbWhn.js   509.85 kB │ gzip: 135.07 kB
```

**Target:** <300KB gzipped main bundle

---

## 🔧 Implementation Steps

### Step 1: Configure Code Splitting (`vite.config.ts`)

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-arrow': ['apache-arrow'],
          'vendor-ui': ['clsx', 'zustand', '@tanstack/react-query'],
          'vendor-charts': ['d3-scale', 'd3-array', 'd3-format'],
        },
      },
    },
    chunkSizeWarningLimit: 300,
  },
});
```

### Step 2: Lazy Load Heavy Components (`App.tsx`)

```typescript
import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from './components/common';

// Lazy load route-level components
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const DatasetManager = lazy(() => import('./components/Data/DatasetManager'));
const QueryBuilder = lazy(() => import('./components/Query/QueryBuilder'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner size="lg" label="Loading..." />}>
  {currentView === 'dashboard' && <Dashboard />}
  {currentView === 'data' && <DatasetManager />}
  {currentView === 'query' && <QueryBuilder />}
</Suspense>
```

### Step 3: Add Default Exports

Each lazy-loaded component needs a default export:

```typescript
// Dashboard.tsx
export const Dashboard: React.FC = () => { ... };
export default Dashboard;

// DatasetManager.tsx
export const DatasetManager: React.FC = () => { ... };
export default DatasetManager;

// QueryBuilder.tsx
export const QueryBuilder: React.FC = () => { ... };
export default QueryBuilder;
```

### Step 4: Tree-Shake D3

Replace wildcard imports:

```typescript
// ❌ Bad - imports entire d3
import * as d3 from 'd3';

// ✅ Good - imports only what's needed
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { extent, max, min } from 'd3-array';
import { format } from 'd3-format';
```

**Files to check:**
- `src/viz-engine/charts/*.ts`
- `src/components/Chart/*.tsx`
- `src/data-pipeline/*.ts`

### Step 5: Analyze Bundle

```bash
# Install analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  visualizer({
    filename: 'dist/stats.html',
    open: true,
  }),
],

# Build and analyze
npm run build
# Opens stats.html showing bundle composition
```

### Step 6: Remove Unused Dependencies

Check `package.json` for unused packages:

```bash
npx depcheck
```

---

## ✅ Acceptance Criteria

- [ ] `npm run build` shows main chunk <300KB gzipped
- [ ] App still works after code splitting
- [ ] No "Loading chunk failed" errors
- [ ] Initial page load <2s on 3G throttle
- [ ] Bundle analyzer shows no obvious waste

---

## 📊 Expected Output

```
dist/assets/index.js           ~150 kB │ gzip: ~50 kB
dist/assets/vendor-react.js    ~140 kB │ gzip: ~45 kB
dist/assets/vendor-arrow.js    ~200 kB │ gzip: ~60 kB
dist/assets/Dashboard.js       ~50 kB  │ gzip: ~15 kB
dist/assets/QueryBuilder.js    ~40 kB  │ gzip: ~12 kB
```

---

## 🏷️ Labels

`handyman` `priority-p1` `performance` `frontend`

