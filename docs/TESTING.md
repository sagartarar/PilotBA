# Testing Guide for PilotBA

> **Quality Assurance Documentation**  
> Version: 1.0.0  
> Last Updated: December 2025

## 📋 Table of Contents

- [Overview](#overview)
- [Test Strategy](#test-strategy)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [E2E Testing](#e2e-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

PilotBA employs a comprehensive testing strategy across multiple layers:

```
┌─────────────────────────────────────────┐
│         E2E Tests (Playwright)          │  ← User workflows
├─────────────────────────────────────────┤
│     Integration Tests (API/Services)     │  ← Component interaction
├─────────────────────────────────────────┤
│        Unit Tests (Functions/Logic)      │  ← Individual components
└─────────────────────────────────────────┘
```

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All critical paths
- **E2E Tests**: All user workflows
- **Performance**: < 500ms API response time (p95)
- **Security**: Zero HIGH/CRITICAL vulnerabilities

---

## Test Strategy

### Testing Pyramid

```
           /\
          /  \         E2E Tests (10%)
         /    \        - User workflows
        /------\       - Cross-browser
       /        \      
      /          \     Integration Tests (30%)
     /            \    - API endpoints
    /--------------\   - Database operations
   /                \  
  /                  \ Unit Tests (60%)
 /                    \- Functions/methods
/______________________\- Components/modules
```

### Test Types

| Type | Purpose | Tools | Coverage |
|------|---------|-------|----------|
| Unit | Test individual functions | Rust `#[test]`, Vitest | 60% |
| Integration | Test component interaction | Actix-test, MSW | 30% |
| E2E | Test complete workflows | Playwright | 10% |
| Performance | Measure speed/load | Criterion, k6, Lighthouse | Critical paths |
| Security | Find vulnerabilities | cargo-audit, npm audit, Trivy | All dependencies |

---

## Backend Testing

### Setup

```bash
cd backend

# Install test dependencies
cargo build --all-targets

# Run all tests
cargo test --all

# Run with coverage
cargo tarpaulin --out Html
```

### Unit Tests

**Location**: `backend/src/**/*.rs` (alongside code)

**Example**:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_creation() {
        let user = User {
            id: Uuid::new_v4(),
            email: "test@example.com".to_string(),
            name: "Test User".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        assert_eq!(user.email, "test@example.com");
    }
}
```

### Integration Tests

**Location**: `backend/tests/integration/`

**Running**:

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
cargo test --test '*' -- --test-threads=1

# Stop test database
docker-compose -f docker-compose.test.yml down
```

**Example**:

```rust
#[actix_web::test]
async fn test_health_check_endpoint() {
    let app = test::init_service(create_test_app()).await;
    let req = test::TestRequest::get()
        .uri("/api/health")
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}
```

### Benchmarks

**Location**: `backend/benches/`

**Running**:

```bash
cargo bench
```

Results are saved in `target/criterion/` with HTML reports.

---

## Frontend Testing

### Setup

```bash
cd frontend

# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui
```

### Unit Tests

**Location**: `frontend/src/**/*.test.tsx`

**Example**:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from './test/utils/test-utils'
import App from './App'

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByText('PilotBA')).toBeInTheDocument()
  })
})
```

### Component Tests

```typescript
import { render, screen, fireEvent } from './test/utils/test-utils'
import { Dashboard } from './components/Dashboard'

describe('Dashboard Component', () => {
  it('displays dashboard name', () => {
    render(<Dashboard name="Test Dashboard" />)
    expect(screen.getByText('Test Dashboard')).toBeInTheDocument()
  })

  it('handles button click', async () => {
    const handleClick = vi.fn()
    render(<Dashboard onSave={handleClick} />)
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

### Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { createMockQueryClient } from './test/utils/test-utils'

describe('useData Hook', () => {
  it('fetches data successfully', async () => {
    const { result } = renderHook(() => useData(), {
      wrapper: createMockQueryClient,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})
```

### API Mocking (MSW)

**Location**: `frontend/src/test/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test User',
      email: 'test@example.com',
    })
  }),
]
```

---

## E2E Testing

### Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Run tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### Writing E2E Tests

**Location**: `e2e/**/*.spec.ts`

**Example**:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Dashboard Flow', () => {
  test('user can create dashboard', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to dashboards
    await page.click('text=Dashboards')
    
    // Click create button
    await page.click('button:has-text("Create Dashboard")')
    
    // Fill form
    await page.fill('input[name="name"]', 'My Dashboard')
    await page.fill('textarea[name="description"]', 'Test description')
    
    // Submit
    await page.click('button:has-text("Save")')
    
    // Verify
    await expect(page.locator('text=My Dashboard')).toBeVisible()
  })
})
```

### Running Specific Browsers

```bash
# Chrome only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Mobile
npx playwright test --project="Mobile Chrome"
```

### Debugging Failed Tests

```bash
# Run with headed browser
npx playwright test --headed

# Run specific test with debug
npx playwright test --debug e2e/dashboard.spec.ts

# View trace
npx playwright show-trace trace.zip
```

---

## Performance Testing

### Backend Benchmarks

```bash
cd backend
cargo bench --bench query_benchmarks
```

**Interpreting Results**:

```
query_parsing/0         time:   [1.2345 µs 1.2567 µs 1.2789 µs]
                        change: [-2.34% -1.23% -0.12%] (p = 0.03)
```

- Look for regressions (positive change %)
- Target: < 100ms for query execution
- Monitor memory usage

### API Load Testing

```bash
# Using the script
./scripts/performance-test.sh

# Or manually with k6
k6 run -u 100 -d 60s load-test.js
```

**Thresholds**:

- p95 response time < 500ms
- p99 response time < 1000ms
- Error rate < 1%
- Throughput > 1000 req/s

### Frontend Performance

```bash
# Bundle analysis
cd frontend
npm run build
du -sh dist/*

# Lighthouse audit
lighthouse http://localhost:3000 --view
```

**Target Metrics**:

- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Cumulative Layout Shift (CLS): < 0.1
- Bundle size: < 5MB

---

## Security Testing

### Automated Scans

```bash
# Run all security checks
./scripts/security-scan.sh

# Backend only
cd backend
cargo audit

# Frontend only
cd frontend
npm audit --audit-level=moderate
```

### Manual Security Testing

#### SQL Injection Test

```bash
# Test with malicious input
curl -X POST http://localhost:8080/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users WHERE id = 1 OR 1=1"}'
```

Expected: Should be sanitized or rejected

#### XSS Test

```javascript
// In browser console
document.cookie = 'test=<script>alert("xss")</script>'
```

Expected: Script should not execute

#### CSRF Test

```bash
# Try request without CSRF token
curl -X POST http://localhost:8080/api/dashboards \
  -H "Content-Type: application/json" \
  -d '{"name": "Malicious Dashboard"}'
```

Expected: Should be rejected (401/403)

### Security Checklist

- [ ] All dependencies up to date
- [ ] No HIGH/CRITICAL vulnerabilities
- [ ] Input validation on all endpoints
- [ ] Output encoding prevents XSS
- [ ] SQL queries use parameterization
- [ ] Authentication required for sensitive endpoints
- [ ] HTTPS enforced in production
- [ ] Secrets not in code/logs
- [ ] Rate limiting implemented
- [ ] CORS configured correctly

---

## CI/CD Integration

### GitHub Actions Workflows

**Test Workflow** (`.github/workflows/test.yml`):
- Runs on: Push, PR
- Backend tests (unit + integration)
- Frontend tests (unit + coverage)
- E2E tests
- Security scans

**Performance Workflow** (`.github/workflows/performance.yml`):
- Runs on: Push, PR, weekly schedule
- Backend benchmarks
- Load testing
- Lighthouse audit

**CodeQL Workflow** (`.github/workflows/codeql.yml`):
- Runs on: Push, PR, weekly schedule
- Static analysis
- Security vulnerabilities

### Running Locally (Pre-commit)

```bash
# Run all checks
./scripts/run-all-tests.sh

# Or use pre-commit hook
cp scripts/pre-commit.sh .git/hooks/pre-commit
```

---

## Best Practices

### Writing Good Tests

#### ✅ DO

```typescript
// Clear test name
test('should display error message when API fails', async () => {
  // Arrange
  const mockError = new Error('API Error')
  server.use(
    http.get('/api/data', () => HttpResponse.error())
  )

  // Act
  render(<DataComponent />)

  // Assert
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })
})
```

#### ❌ DON'T

```typescript
// Vague test name
test('test1', async () => {
  // No arrangement
  render(<DataComponent />)
  // Unclear assertion
  expect(true).toBe(true)
})
```

### Test Organization

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx         ← Unit tests
│   │   └── Button.stories.tsx      ← Storybook (optional)
│   └── Dashboard/
│       ├── Dashboard.tsx
│       ├── Dashboard.test.tsx
│       └── __tests__/              ← Integration tests
│           └── Dashboard.integration.test.tsx
```

### Test Data Management

```typescript
// Use fixtures
import { mockUser, mockDashboard } from '@/test/mocks/mockData'

// Use factories
const createUser = (overrides = {}) => ({
  id: uuid(),
  email: 'test@example.com',
  ...overrides,
})
```

### Flaky Test Prevention

1. **Avoid timing dependencies**
   ```typescript
   // ❌ BAD
   await sleep(1000)
   
   // ✅ GOOD
   await waitFor(() => expect(element).toBeVisible())
   ```

2. **Clean up after tests**
   ```typescript
   afterEach(() => {
     cleanup()
     server.resetHandlers()
   })
   ```

3. **Isolate tests**
   ```typescript
   // Each test should be independent
   test('test 1', () => { /* ... */ })
   test('test 2', () => { /* ... */ })
   ```

---

## Troubleshooting

### Common Issues

#### Backend Tests Failing

**Issue**: Database connection error

```bash
# Solution: Start test database
docker-compose -f docker-compose.test.yml up -d postgres redis

# Verify connection
psql -h localhost -U test -d pilotba_test
```

#### Frontend Tests Failing

**Issue**: MSW handlers not working

```typescript
// Solution: Ensure server is started in setup
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

#### E2E Tests Timing Out

**Issue**: Application not starting

```bash
# Solution: Check if ports are available
lsof -i :3000
lsof -i :8080

# Kill processes if needed
kill -9 <PID>
```

#### Coverage Too Low

```bash
# Find uncovered code
npm run test:coverage
open coverage/lcov-report/index.html

# Focus on critical paths first
# Don't aim for 100% - focus on important code
```

### Getting Help

1. Check test output logs
2. Run tests with `--verbose` flag
3. Use debugger: `test.only()` or `test.debug()`
4. Review test documentation
5. Ask team for help

---

## Quick Reference

### Common Commands

```bash
# Backend
cargo test                          # All backend tests
cargo test --lib                    # Unit tests only
cargo test --test integration       # Integration tests
cargo bench                         # Benchmarks
cargo audit                         # Security audit

# Frontend
npm test                            # All frontend tests
npm run test:watch                  # Watch mode
npm run test:coverage               # With coverage
npm run lint                        # Linting
npm audit                           # Security audit

# E2E
npx playwright test                 # All E2E tests
npx playwright test --ui            # Interactive mode
npx playwright test --debug         # Debug mode
npx playwright show-report          # View last report

# Full Suite
./scripts/run-all-tests.sh          # Everything
./scripts/performance-test.sh       # Performance only
./scripts/security-scan.sh          # Security only
```

### Test File Patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| `*.test.ts` | `src/` | Unit tests |
| `*.spec.ts` | `e2e/` | E2E tests |
| `*_test.rs` | `backend/tests/unit/` | Rust unit tests |
| `*_tests.rs` | `backend/tests/integration/` | Rust integration tests |

---

## Resources

- [Rust Testing Book](https://rust-lang.github.io/book/ch11-00-testing.html)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Load Testing](https://k6.io/docs/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

---

**Last Updated**: December 2025  
**Maintained By**: QA Team  
**Questions?**: Contact the testing team or open an issue

