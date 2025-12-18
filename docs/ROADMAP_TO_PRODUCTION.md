# 🚀 PilotBA: Roadmap to Production

**Goal:** Production-ready BI tool at fraction of cost, superior performance, secure & easy to use.

---

## 📍 Current State: 83% MVP Complete

| Done | Pending |
|------|---------|
| ✅ File upload (CSV/JSON/Arrow) | ⬜ Error handling system |
| ✅ Data table with virtual scroll | ⬜ Bundle optimization (<300KB) |
| ✅ 4 chart types (WebGL) | ⬜ Test runner fix |
| ✅ Query builder | ⬜ Backend API |
| ✅ Dashboard | ⬜ Authentication |
| ✅ 825+ tests | ⬜ Production deployment |

---

## 🎯 Production Checklist

### Week 1: Stability & Polish

| Task | Owner | Priority | Done When |
|------|-------|----------|-----------|
| Fix TypeScript build errors | Handyman | P0 | `npm run build` passes |
| Fix NODE_OPTIONS test issue | Toaster | P0 | `npm test` passes |
| Implement ErrorService | Handyman | P0 | All errors logged with codes |
| Add error boundaries | Handyman | P0 | No white screen crashes |
| Bundle size < 300KB | Handyman | P1 | Build output shows <300KB gzip |

### Week 2: Security & Performance

| Task | Owner | Priority | Done When |
|------|-------|----------|-----------|
| Input sanitization (XSS) | Handyman | P0 | No XSS in file names/data |
| CSP headers setup | Handyman | P0 | CSP configured in vite.config |
| Performance benchmarks | Toaster | P1 | 1M rows loads in <500ms |
| Memory leak testing | Toaster | P1 | No leaks after 10 file loads |
| Lighthouse score >80 | Toaster | P1 | Screenshot of report |

### Week 3: Backend MVP

| Task | Owner | Priority | Done When |
|------|-------|----------|-----------|
| Rust API scaffolding | Handyman | P0 | `/health` endpoint works |
| File storage endpoint | Handyman | P0 | Upload/download works |
| Basic auth (JWT) | Handyman | P1 | Login/logout works |
| API error handling | Handyman | P1 | Consistent error responses |
| Backend tests | Toaster | P1 | 80% coverage |

### Week 4: Integration & Deploy

| Task | Owner | Priority | Done When |
|------|-------|----------|-----------|
| Frontend ↔ Backend integration | Handyman | P0 | E2E flow works |
| Docker containerization | Handyman | P0 | `docker-compose up` works |
| CI/CD pipeline | Handyman | P1 | Auto-deploy on merge |
| Production environment | Handyman | P1 | Live URL accessible |
| E2E production tests | Toaster | P1 | Critical paths pass |

---

## 📋 Detailed Task Specifications

---

### HANDYMAN-004: Error Handling System

**Time:** 1 day | **Priority:** P0

**Deliverables:**
```
frontend/src/services/
├── ErrorService.ts      # Central error handler
├── errorCodes.ts        # Error code definitions
└── handlers/
    ├── fileErrorHandler.ts
    ├── queryErrorHandler.ts
    └── vizErrorHandler.ts

frontend/src/store/
└── logStore.ts          # Error log storage
```

**Implementation:**
1. Create `PilotBAError` class with: id, severity, code, message, context
2. Create `ErrorService` singleton with: capture(), getRecent(), export()
3. Wrap all async operations in try-catch with proper error codes
4. Store last 1000 errors in Zustand store

**Acceptance Criteria:**
- [ ] File upload errors show user-friendly message
- [ ] All errors logged with timestamp and context
- [ ] Error toast appears for ERROR/CRITICAL severity
- [ ] "Export Logs" button downloads JSON file

---

### HANDYMAN-005: Bundle Optimization

**Time:** 0.5 day | **Priority:** P1

**Current:** 509KB gzipped | **Target:** <300KB gzipped

**Actions:**
```typescript
// 1. Add to vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-arrow': ['apache-arrow'],
        'vendor-charts': ['d3', 'd3-scale', 'd3-array'],
      }
    }
  }
}

// 2. Lazy load heavy components in App.tsx
const Dashboard = lazy(() => import('./components/Dashboard'));
const QueryBuilder = lazy(() => import('./components/Query/QueryBuilder'));
const ChartContainer = lazy(() => import('./components/Chart/ChartContainer'));

// 3. Tree-shake unused d3 modules
import { scaleLinear } from 'd3-scale';  // ✅ Good
import * as d3 from 'd3';                 // ❌ Bad
```

**Acceptance Criteria:**
- [ ] `npm run build` shows <300KB gzipped
- [ ] App loads in <2 seconds on 3G throttle

---

### HANDYMAN-006: Security Hardening

**Time:** 0.5 day | **Priority:** P0

**Actions:**
```typescript
// 1. Sanitize file names
const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

// 2. Validate file content before parsing
if (file.size > 100 * 1024 * 1024) throw new Error('FILE_TOO_LARGE');
if (!['text/csv', 'application/json'].includes(file.type)) throw new Error('INVALID_TYPE');

// 3. Add CSP to vite.config.ts
server: {
  headers: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval';"
  }
}

// 4. Sanitize data display (prevent XSS)
const displayValue = DOMPurify.sanitize(String(value));
```

**Acceptance Criteria:**
- [ ] File names with `<script>` tags are sanitized
- [ ] CSP headers present in response
- [ ] No eval() in production code (except Arrow)

---

### HANDYMAN-007: Backend API MVP

**Time:** 3 days | **Priority:** P0

**Endpoints:**
```
POST   /api/auth/login      # JWT login
POST   /api/auth/logout     # Invalidate token
GET    /api/auth/me         # Current user

POST   /api/files           # Upload file
GET    /api/files           # List files
GET    /api/files/:id       # Download file
DELETE /api/files/:id       # Delete file

GET    /api/health          # Health check
```

**File Structure:**
```
backend/src/
├── main.rs
├── config.rs
├── routes/
│   ├── auth.rs
│   ├── files.rs
│   └── health.rs
├── models/
│   ├── user.rs
│   └── file.rs
├── middleware/
│   └── auth.rs
└── errors.rs
```

**Acceptance Criteria:**
- [ ] `cargo test` passes
- [ ] Can upload 100MB file
- [ ] JWT auth works
- [ ] Errors return consistent JSON format

---

### TOASTER-005: Fix Test Runner

**Time:** 0.5 day | **Priority:** P0

**Problem:** `NODE_OPTIONS` error in Vitest workers

**Investigation:**
```bash
# Check what's setting NODE_OPTIONS
env | grep NODE

# Try running without it
unset NODE_OPTIONS && npm test
```

**Likely Fix:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'forks',  // Use forks instead of threads
    // OR
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
```

**Acceptance Criteria:**
- [ ] `npm test` runs without NODE_OPTIONS error
- [ ] All existing tests pass
- [ ] CI pipeline runs tests successfully

---

### TOASTER-006: Performance Benchmarks

**Time:** 1 day | **Priority:** P1

**Benchmarks to Run:**
```
| Test | Target | How to Measure |
|------|--------|----------------|
| Load 100K rows | <200ms | performance.now() |
| Load 1M rows | <500ms | performance.now() |
| Render 100K points | 60 FPS | requestAnimationFrame counter |
| Filter 1M rows | <50ms | performance.now() |
| Memory (1M rows) | <500MB | performance.memory |
```

**Test File:** `frontend/src/test/benchmarks/performance.bench.ts`

```typescript
import { bench } from 'vitest';

bench('load 1M rows CSV', async () => {
  const csv = generateCSV(1_000_000, 10);
  await parser.parse(csv);
});

bench('filter 1M rows', async () => {
  const table = await loadTable(1_000_000);
  FilterOperator.apply(table, { column: 'value', operator: 'gt', value: 500 });
});
```

**Acceptance Criteria:**
- [ ] Benchmark results documented
- [ ] All targets met or issues logged
- [ ] Memory leak test passes (10 consecutive loads)

---

### TOASTER-007: E2E Critical Paths

**Time:** 1 day | **Priority:** P1

**Critical User Flows:**
```typescript
// e2e/critical-paths.spec.ts

test('Upload CSV and view data', async ({ page }) => {
  await page.goto('/');
  await page.setInputFiles('[data-testid="file-input"]', 'test-data.csv');
  await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
  await expect(page.locator('tr')).toHaveCount.greaterThan(1);
});

test('Create chart from data', async ({ page }) => {
  // Upload file
  // Click "Create Chart"
  // Select chart type
  // Configure axes
  // Verify chart renders
});

test('Filter data and export', async ({ page }) => {
  // Upload file
  // Add filter
  // Verify filtered count
  // Export filtered data
});

test('Error handling - invalid file', async ({ page }) => {
  await page.setInputFiles('[data-testid="file-input"]', 'invalid.exe');
  await expect(page.locator('[data-testid="error-toast"]')).toContainText('Unsupported');
});
```

**Acceptance Criteria:**
- [ ] 4 critical path tests pass
- [ ] Tests run in CI
- [ ] Screenshots on failure

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Build | ✅ Pass | `npm run build` |
| Tests | ✅ Pass | `npm test` |
| Bundle | <300KB | Build output |
| Load 1M rows | <500ms | Benchmark |
| Lighthouse Perf | >80 | Audit |
| Lighthouse A11y | >90 | Audit |
| Security | No critical | `npm audit` |

---

## 🗓️ Timeline

```
Week 1 (Dec 18-22)
├── Mon: Error handling + Test runner fix
├── Tue: Bundle optimization + Security
├── Wed: Performance benchmarks
├── Thu: E2E tests
└── Fri: Review & bug fixes

Week 2 (Dec 25-29)
├── Mon: Backend scaffolding
├── Tue: Auth + File endpoints
├── Wed: Backend tests
├── Thu: Frontend integration
└── Fri: Docker + CI/CD

Week 3 (Jan 1-5)
├── Mon: Production deployment
├── Tue: Production testing
├── Wed: Bug fixes
├── Thu: Documentation
└── Fri: 🚀 LAUNCH
```

---

## 🔒 Security Checklist (Pre-Launch)

- [ ] No secrets in code
- [ ] HTTPS only
- [ ] JWT tokens expire
- [ ] File type validation
- [ ] File size limits
- [ ] Input sanitization
- [ ] CSP headers
- [ ] Rate limiting (backend)
- [ ] SQL injection prevention
- [ ] CORS configured

---

## 💰 Cost Comparison (Our Value Prop)

| | Tableau | PowerBI | **PilotBA** |
|--|---------|---------|-------------|
| Per user/month | $70-150 | $10-20 | **$0** |
| 100 users/year | $84,000-180,000 | $12,000-24,000 | **$0** |
| Self-hosted | Complex | No | **Easy** |
| Data privacy | Cloud | Cloud | **Client-side** |

---

*Document Owner: Architect*
*Last Updated: December 17, 2025*

