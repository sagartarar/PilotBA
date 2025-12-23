# 🍞 Toaster Task Assignment - December 23, 2025

**Role:** Senior QA Engineer (Toaster)  
**Assigned By:** Lead Architect  
**Sprint:** December 23, 2025 - January 6, 2026

---

## Your Priority Queue

| Priority | Task ID | Description | ETA | Depends On |
|----------|---------|-------------|-----|------------|
| P0 | TOASTER-008 | Validate Parser Test Fixes | 0.5 days | HANDYMAN-008 |
| P0 | TOASTER-009 | Backend API Tests | 1-2 days | HANDYMAN-009 |
| P1 | TOASTER-010 | E2E Full Flow Tests | 1-2 days | HANDYMAN-011 |
| P1 | TOASTER-011 | Performance & Security Validation | 1 day | HANDYMAN-011 |

**While waiting for Handyman:** Review existing test coverage and identify gaps

---

## Pre-Sprint: Review Current State

Before Handyman's fixes are ready, review and document:

```bash
cd frontend

# Current test state
npm run test:run 2>&1 | tee test-output.txt

# Count passing/failing
grep -c "✓" test-output.txt
grep -c "✗" test-output.txt

# Generate coverage report
npm run test:coverage
```

### Document Current Baseline

Create a baseline document tracking:
- Total tests: 1,021
- Passing: 840
- Failing: 181
- Coverage %: [capture from report]

---

## TOASTER-008: Validate Parser Test Fixes

### Trigger

When Handyman notifies that HANDYMAN-008 is complete.

### Validation Steps

#### 1. Pull Latest Changes

```bash
git pull origin develop
cd frontend
npm install  # In case dependencies changed
```

#### 2. Run Full Test Suite

```bash
# Run all tests with verbose output
npm run test:run -- --reporter=verbose 2>&1 | tee test-results.txt

# Check for parser test results specifically
npm run test:run -- --grep "Parser" --reporter=verbose

# Generate coverage report
npm run test:coverage
```

#### 3. Compare with Baseline

```markdown
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Tests | 1,021 | | |
| Passing | 840 | | |
| Failing | 181 | | |
| Pass Rate | 82.3% | | |
| Coverage | | | |
```

#### 4. Check for Regressions

```bash
# Run tests that were passing before
npm run test:run -- --grep "Sort" 
npm run test:run -- --grep "Filter"
npm run test:run -- --grep "Aggregate"
npm run test:run -- --grep "ErrorService"
npm run test:run -- --grep "sanitize"
```

#### 5. Update Snapshots if Needed

```bash
# If snapshot tests fail due to expected changes
npm run test:run -- --update
```

### Report Template

Create report in `docs/PARSER_FIX_VALIDATION_2025-12-XX.md`:

```markdown
# Parser Fix Validation Report

**Date:** [date]
**Handyman Task:** HANDYMAN-008
**Validator:** Toaster

## Summary

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| Parser Tests Passing | 0/181 | X/181 | ✅/⚠️/❌ |
| Total Tests Passing | 840/1021 | X/1021 | ✅/⚠️/❌ |
| Regressions | - | X | ✅/⚠️/❌ |

## Detailed Results

### Parser Tests
- CSVParser: X/Y passing
- JSONParser: X/Y passing
- ParquetParser: X/Y passing
- ArrowParser: X/Y passing

### Regressions Found
[List any tests that were passing before but now fail]

### New Issues Found
[List any new issues discovered]

## Recommendation
[ ] Ready for merge
[ ] Needs fixes (see issues above)
```

### Acceptance Criteria

- [ ] All parser tests pass (0 failures)
- [ ] No regressions in other tests
- [ ] Pass rate > 95%
- [ ] Validation report created
- [ ] Notify Architect with results

---

## TOASTER-009: Backend API Tests

### Trigger

When Handyman notifies that HANDYMAN-009 is complete.

### Test Plan

Create comprehensive integration tests for auth endpoints:

#### Test File Structure

```
backend/tests/
├── common/
│   └── mod.rs          # Test utilities
├── integration/
│   ├── mod.rs
│   ├── auth_tests.rs   # YOUR NEW FILE
│   └── files_tests.rs  # YOUR NEW FILE
```

#### Auth Test Cases

```rust
// backend/tests/integration/auth_tests.rs

use crate::common::{spawn_app, TestApp};

// Registration Tests
#[tokio::test]
async fn test_register_success() {
    let app = spawn_app().await;
    
    let response = app.post_json("/api/auth/register", json!({
        "email": "test@example.com",
        "password": "SecureP@ss123"
    })).await;
    
    assert_eq!(response.status(), 201);
    let body: AuthResponse = response.json().await;
    assert!(!body.access_token.is_empty());
    assert!(!body.refresh_token.is_empty());
}

#[tokio::test]
async fn test_register_duplicate_email() {
    let app = spawn_app().await;
    
    // First registration
    app.post_json("/api/auth/register", json!({
        "email": "test@example.com",
        "password": "SecureP@ss123"
    })).await;
    
    // Duplicate
    let response = app.post_json("/api/auth/register", json!({
        "email": "test@example.com",
        "password": "AnotherP@ss456"
    })).await;
    
    assert_eq!(response.status(), 409); // Conflict
}

#[tokio::test]
async fn test_register_invalid_email() {
    let app = spawn_app().await;
    
    let response = app.post_json("/api/auth/register", json!({
        "email": "not-an-email",
        "password": "SecureP@ss123"
    })).await;
    
    assert_eq!(response.status(), 400);
}

#[tokio::test]
async fn test_register_weak_password() {
    let app = spawn_app().await;
    
    let response = app.post_json("/api/auth/register", json!({
        "email": "test@example.com",
        "password": "123"  // Too weak
    })).await;
    
    assert_eq!(response.status(), 400);
}

// Login Tests
#[tokio::test]
async fn test_login_success() {
    let app = spawn_app().await;
    
    // Register first
    app.post_json("/api/auth/register", json!({
        "email": "test@example.com",
        "password": "SecureP@ss123"
    })).await;
    
    // Login
    let response = app.post_json("/api/auth/login", json!({
        "email": "test@example.com",
        "password": "SecureP@ss123"
    })).await;
    
    assert_eq!(response.status(), 200);
    let body: AuthResponse = response.json().await;
    assert!(!body.access_token.is_empty());
}

#[tokio::test]
async fn test_login_wrong_password() {
    let app = spawn_app().await;
    
    // Register
    app.post_json("/api/auth/register", json!({
        "email": "test@example.com",
        "password": "SecureP@ss123"
    })).await;
    
    // Wrong password
    let response = app.post_json("/api/auth/login", json!({
        "email": "test@example.com",
        "password": "WrongPassword"
    })).await;
    
    assert_eq!(response.status(), 401);
}

#[tokio::test]
async fn test_login_nonexistent_user() {
    let app = spawn_app().await;
    
    let response = app.post_json("/api/auth/login", json!({
        "email": "nobody@example.com",
        "password": "SomePassword123"
    })).await;
    
    assert_eq!(response.status(), 401);
}

// Token Tests
#[tokio::test]
async fn test_refresh_token_success() {
    let app = spawn_app().await;
    
    // Register and get tokens
    let auth_response: AuthResponse = app.post_json("/api/auth/register", json!({
        "email": "test@example.com",
        "password": "SecureP@ss123"
    })).await.json().await;
    
    // Refresh token
    let response = app.post_json("/api/auth/refresh", json!({
        "refresh_token": auth_response.refresh_token
    })).await;
    
    assert_eq!(response.status(), 200);
    let new_tokens: AuthResponse = response.json().await;
    assert!(!new_tokens.access_token.is_empty());
}

#[tokio::test]
async fn test_protected_route_without_token() {
    let app = spawn_app().await;
    
    let response = app.get("/api/auth/me").await;
    
    assert_eq!(response.status(), 401);
}

#[tokio::test]
async fn test_protected_route_with_valid_token() {
    let app = spawn_app().await;
    
    // Register
    let auth_response: AuthResponse = app.post_json("/api/auth/register", json!({
        "email": "test@example.com",
        "password": "SecureP@ss123"
    })).await.json().await;
    
    // Access protected route
    let response = app.get_with_auth("/api/auth/me", &auth_response.access_token).await;
    
    assert_eq!(response.status(), 200);
}

#[tokio::test]
async fn test_logout_invalidates_token() {
    let app = spawn_app().await;
    
    // Register
    let auth_response: AuthResponse = app.post_json("/api/auth/register", json!({
        "email": "test@example.com",
        "password": "SecureP@ss123"
    })).await.json().await;
    
    // Logout
    app.post_with_auth("/api/auth/logout", &auth_response.access_token, json!({})).await;
    
    // Try to use refresh token (should fail)
    let response = app.post_json("/api/auth/refresh", json!({
        "refresh_token": auth_response.refresh_token
    })).await;
    
    assert_eq!(response.status(), 401);
}
```

#### File API Test Cases

```rust
// backend/tests/integration/files_tests.rs

#[tokio::test]
async fn test_upload_csv_file() {
    let app = spawn_app().await;
    let token = app.login_as_test_user().await;
    
    let csv_content = "name,value\nAlice,100\nBob,200";
    
    let response = app.upload_file(
        &token,
        "test.csv",
        "text/csv",
        csv_content.as_bytes()
    ).await;
    
    assert_eq!(response.status(), 201);
    let file_info: FileInfo = response.json().await;
    assert_eq!(file_info.row_count, Some(2));
    assert_eq!(file_info.column_count, Some(2));
}

#[tokio::test]
async fn test_upload_file_too_large() {
    let app = spawn_app().await;
    let token = app.login_as_test_user().await;
    
    // Create 101MB of data
    let large_content = vec![b'x'; 101 * 1024 * 1024];
    
    let response = app.upload_file(
        &token,
        "large.csv",
        "text/csv",
        &large_content
    ).await;
    
    assert_eq!(response.status(), 413); // Payload Too Large
}

#[tokio::test]
async fn test_upload_invalid_file_type() {
    let app = spawn_app().await;
    let token = app.login_as_test_user().await;
    
    let response = app.upload_file(
        &token,
        "script.exe",
        "application/x-executable",
        b"malicious content"
    ).await;
    
    assert_eq!(response.status(), 400);
}

#[tokio::test]
async fn test_list_user_files() {
    let app = spawn_app().await;
    let token = app.login_as_test_user().await;
    
    // Upload some files
    app.upload_file(&token, "file1.csv", "text/csv", b"a,b\n1,2").await;
    app.upload_file(&token, "file2.csv", "text/csv", b"x,y\n3,4").await;
    
    let response = app.get_with_auth("/api/files", &token).await;
    
    assert_eq!(response.status(), 200);
    let files: Vec<FileInfo> = response.json().await;
    assert_eq!(files.len(), 2);
}

#[tokio::test]
async fn test_delete_file() {
    let app = spawn_app().await;
    let token = app.login_as_test_user().await;
    
    // Upload
    let response = app.upload_file(&token, "delete-me.csv", "text/csv", b"a,b\n1,2").await;
    let file_info: FileInfo = response.json().await;
    
    // Delete
    let delete_response = app.delete_with_auth(
        &format!("/api/files/{}", file_info.id),
        &token
    ).await;
    
    assert_eq!(delete_response.status(), 204);
    
    // Verify deleted
    let get_response = app.get_with_auth(
        &format!("/api/files/{}", file_info.id),
        &token
    ).await;
    
    assert_eq!(get_response.status(), 404);
}

#[tokio::test]
async fn test_cannot_access_other_users_files() {
    let app = spawn_app().await;
    
    // User 1 uploads file
    let token1 = app.login_as_user("user1@test.com").await;
    let response = app.upload_file(&token1, "private.csv", "text/csv", b"secret,data\n1,2").await;
    let file_info: FileInfo = response.json().await;
    
    // User 2 tries to access
    let token2 = app.login_as_user("user2@test.com").await;
    let get_response = app.get_with_auth(
        &format!("/api/files/{}", file_info.id),
        &token2
    ).await;
    
    assert_eq!(get_response.status(), 404); // Not found (not 403, to avoid info leak)
}
```

### Running Backend Tests

```bash
cd backend

# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test file
cargo test --test auth_tests

# Run with coverage (if cargo-tarpaulin installed)
cargo tarpaulin --out Html
```

### Acceptance Criteria

- [ ] 20+ integration tests for auth
- [ ] 10+ integration tests for files
- [ ] All tests pass
- [ ] 80%+ code coverage
- [ ] No security issues
- [ ] Test report created

---

## TOASTER-010: E2E Full Flow Tests

### Trigger

When Handyman notifies that HANDYMAN-011 is complete.

### Test File

Create `frontend/e2e/user-journey.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration & Authentication', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('[data-testid="email-input"]', `test-${Date.now()}@example.com`);
    await page.fill('[data-testid="password-input"]', 'SecureP@ss123');
    await page.fill('[data-testid="confirm-password-input"]', 'SecureP@ss123');
    await page.click('[data-testid="register-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should login with existing credentials', async ({ page }) => {
    // First register
    const email = `test-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', 'SecureP@ss123');
    await page.fill('[data-testid="confirm-password-input"]', 'SecureP@ss123');
    await page.click('[data-testid="register-button"]');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', email);
    await page.fill('[data-testid="password-input"]', 'SecureP@ss123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'nobody@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid');
  });
});

test.describe('Complete User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecureP@ss123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should upload CSV and view data', async ({ page }) => {
    // Click upload button
    await page.click('[data-testid="upload-button"]');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/valid-data.csv');
    
    // Wait for processing
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible({ timeout: 10000 });
    
    // Verify data loaded
    const rowCount = await page.locator('[data-testid="row-count"]').textContent();
    expect(parseInt(rowCount || '0')).toBeGreaterThan(0);
  });

  test('should create chart from uploaded data', async ({ page }) => {
    // Upload data first
    await page.click('[data-testid="upload-button"]');
    await page.locator('input[type="file"]').setInputFiles('e2e/fixtures/valid-data.csv');
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible({ timeout: 10000 });
    
    // Create chart
    await page.click('[data-testid="create-chart-button"]');
    await page.selectOption('[data-testid="chart-type-select"]', 'bar');
    await page.selectOption('[data-testid="x-axis-select"]', 'category');
    await page.selectOption('[data-testid="y-axis-select"]', 'value');
    await page.click('[data-testid="render-chart-button"]');
    
    // Verify chart rendered
    await expect(page.locator('[data-testid="chart-container"] canvas')).toBeVisible();
  });

  test('should apply filter and see updated results', async ({ page }) => {
    // Upload data
    await page.click('[data-testid="upload-button"]');
    await page.locator('input[type="file"]').setInputFiles('e2e/fixtures/valid-data.csv');
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible({ timeout: 10000 });
    
    const initialCount = await page.locator('[data-testid="row-count"]').textContent();
    
    // Add filter
    await page.click('[data-testid="add-filter-button"]');
    await page.selectOption('[data-testid="filter-column"]', 'value');
    await page.selectOption('[data-testid="filter-operator"]', 'greaterThan');
    await page.fill('[data-testid="filter-value"]', '50');
    await page.click('[data-testid="apply-filter-button"]');
    
    // Verify filtered
    const filteredCount = await page.locator('[data-testid="row-count"]').textContent();
    expect(parseInt(filteredCount || '0')).toBeLessThan(parseInt(initialCount || '0'));
  });

  test('should logout and require login', async ({ page }) => {
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    await expect(page).toHaveURL('/login');
    
    // Try to access dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Error Handling', () => {
  test('should show error for unsupported file type', async ({ page }) => {
    await page.goto('/');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/fixtures/invalid-data.txt');
    
    await expect(page.locator('[data-testid="error-toast"]')).toContainText('Unsupported');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline
    await page.route('**/api/**', route => route.abort());
    
    await page.goto('/');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('network');
  });
});
```

### Running E2E Tests

```bash
cd frontend

# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run specific test
npx playwright test user-journey.spec.ts

# Run with trace (for debugging)
npx playwright test --trace on

# View report
npx playwright show-report
```

### Acceptance Criteria

- [ ] 15+ E2E test cases
- [ ] All critical paths covered
- [ ] Tests run in CI
- [ ] Screenshots captured on failure
- [ ] Video recording working

---

## TOASTER-011: Performance & Security Validation

### Performance Testing

#### Lighthouse Audit

```bash
# Install lighthouse if needed
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 \
  --output=html \
  --output-path=./reports/lighthouse-$(date +%Y%m%d).html \
  --preset=desktop
```

**Target Metrics:**
| Metric | Target |
|--------|--------|
| Performance | > 80 |
| Accessibility | > 90 |
| Best Practices | > 80 |
| SEO | > 80 |

#### Load Testing with k6

Create `tests/load/api-load.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // Ramp up
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 500 },  // Spike to 500
    { duration: '1m', target: 500 },   // Stay at 500
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% requests under 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% failure
  },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
  // Health check
  let res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(1);
}
```

Run with:
```bash
k6 run tests/load/api-load.js
```

#### Memory Leak Test

```typescript
// frontend/src/test/memory/leak-test.ts
import { expect, test } from 'vitest';

test('no memory leak after 10 file loads', async () => {
  const initialMemory = performance.memory?.usedJSHeapSize;
  
  for (let i = 0; i < 10; i++) {
    // Simulate file load and processing
    const table = await loadLargeFile();
    // Process
    await filterTable(table);
    await sortTable(table);
    // Cleanup
    table = null;
    await new Promise(r => setTimeout(r, 100));
    global.gc?.(); // Force GC if available
  }
  
  const finalMemory = performance.memory?.usedJSHeapSize;
  const memoryGrowth = finalMemory - initialMemory;
  
  // Memory should not grow more than 50MB after 10 iterations
  expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
});
```

### Security Testing

#### OWASP ZAP Scan (if available)

```bash
# Run ZAP against local instance
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html
```

#### Manual Security Checklist

- [ ] No secrets in code (`git secrets --scan`)
- [ ] HTTPS enforced in production
- [ ] JWT tokens have expiration
- [ ] Passwords hashed with Argon2
- [ ] File uploads validated
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CSRF protection
- [ ] Rate limiting on auth endpoints
- [ ] CORS properly configured
- [ ] Security headers present (CSP, HSTS, etc.)

### Report Template

Create `docs/SECURITY_PERFORMANCE_REPORT_2025-01-XX.md`:

```markdown
# Security & Performance Validation Report

**Date:** [date]
**Validator:** Toaster

## Performance Results

### Lighthouse Scores
| Metric | Score | Target | Status |
|--------|-------|--------|--------|
| Performance | | > 80 | |
| Accessibility | | > 90 | |
| Best Practices | | > 80 | |
| SEO | | > 80 | |

### Load Testing
| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| p95 Response Time | | < 500ms | |
| Error Rate | | < 1% | |
| Max Concurrent Users | | 500 | |

### Memory Testing
| Test | Result | Target | Status |
|------|--------|--------|--------|
| Memory after 10 loads | | < 500MB | |
| Memory leak detected | | No | |

## Security Results

### Automated Scans
- [ ] OWASP ZAP: [X issues / passed]
- [ ] npm audit: [X issues / passed]
- [ ] cargo audit: [X issues / passed]

### Manual Checks
[Checklist results]

## Issues Found
[List any issues]

## Recommendations
[Any recommendations]
```

### Acceptance Criteria

- [ ] Lighthouse Performance > 80
- [ ] Load test passes (500 users)
- [ ] No memory leaks
- [ ] No critical security issues
- [ ] Reports generated

---

## General Guidelines

### Test Quality Standards

1. **Every test must be:**
   - Isolated (no dependencies on other tests)
   - Deterministic (same result every run)
   - Fast (< 5s for unit, < 30s for integration, < 2min for E2E)
   - Readable (clear what's being tested)

2. **Avoid flaky tests:**
   - Use explicit waits, not sleep
   - Use test IDs, not CSS classes
   - Mock external dependencies
   - Clean up after each test

3. **Test naming:**
   ```
   ✅ "should return 401 when password is incorrect"
   ❌ "test login"
   ```

### Communication

- Update issues daily with progress
- Tag `@handyman` when ready for review
- Tag `@architect` if blocked
- Create issues for bugs found

### PR Reviews

When reviewing Handyman's PRs:
1. Check test coverage
2. Look for edge cases not tested
3. Verify error handling tested
4. Check for security concerns
5. Approve or request changes

---

**Ready to validate! Wait for Handyman's notifications.** 🍞

**Questions?** Comment on the issue or tag @architect


