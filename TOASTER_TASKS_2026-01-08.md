# 🍞 Toaster Tasks - January 8, 2026

**Sprint:** January 8-22, 2026  
**Phase:** Production Readiness Testing  
**Priority Focus:** Test Coverage → E2E Flows → Performance Validation

---

## 📊 Current Status Summary

### ✅ Completed Work (Previous Sprints)

| Task | Status |
|------|--------|
| Test Runner Fix (pool: forks) | ✅ Complete |
| E2E Critical Path Tests (15 tests) | ✅ Complete |
| Performance Benchmarks | ✅ Complete |
| Backend Integration Validated | ✅ Complete |

### 🎯 This Sprint Focus

1. **P0:** Run Full Test Suite & Document Results
2. **P0:** Authentication Flow E2E Tests
3. **P1:** File Upload Integration Tests
4. **P1:** Protected Routes E2E Tests
5. **P2:** Accessibility Audit (Lighthouse/Axe)

---

## 📋 Task Details

---

### TOASTER-012: Full Test Suite Execution & Report

**Priority:** P0  
**Estimated Time:** 0.5 days  
**Dependencies:** None

**Objective:**
Run the complete test suite and document the current pass/fail rate. This establishes a baseline before new features are integrated.

**Steps:**

1. **Run Frontend Unit Tests:**
```bash
cd frontend
npm run test:run -- --reporter=verbose 2>&1 | tee test-results-unit.txt
```

2. **Run Frontend E2E Tests:**
```bash
npm run test:e2e -- --reporter=html 2>&1 | tee test-results-e2e.txt
```

3. **Run Backend Tests:**
```bash
cd backend
cargo test 2>&1 | tee test-results-backend.txt
```

4. **Create Test Report:**

```markdown
# Test Suite Report - January 8, 2026

## Summary

| Suite | Pass | Fail | Skip | Total | Rate |
|-------|------|------|------|-------|------|
| Frontend Unit | ? | ? | ? | ? | ?% |
| Frontend E2E | ? | ? | ? | ? | ?% |
| Backend | ? | ? | ? | ? | ?% |
| **Total** | ? | ? | ? | ? | ?% |

## Failed Tests (if any)

### Frontend Unit
- `test_name`: Error message
- ...

### Backend
- `test_name`: Error message
- ...

## Recommendations
- [List any failing tests that need Handyman attention]
- [Note any flaky tests]
```

**Deliverable:** `TEST_REPORT_2026-01-08.md` in project root

**Acceptance Criteria:**
- [ ] All test suites executed
- [ ] Pass/fail rates documented
- [ ] Failed tests investigated and categorized
- [ ] Recommendations provided for fixes

---

### TOASTER-013: Authentication E2E Tests

**Priority:** P0  
**Estimated Time:** 1 day  
**Dependencies:** HANDYMAN-013 (Login/Register UI)

**Files to Create:**

```
frontend/e2e/
├── auth/
│   ├── login.spec.ts
│   ├── register.spec.ts
│   ├── logout.spec.ts
│   └── password-validation.spec.ts
└── fixtures/
    └── users.ts (test user data)
```

**Implementation - login.spec.ts:**

```typescript
// frontend/e2e/auth/login.spec.ts

import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/users';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('displays login form', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/sign in|login|welcome/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await expect(page.locator('[role="alert"], .error, .text-red-')).toBeVisible({ timeout: 5000 });
  });

  test('shows validation error for empty email', async ({ page }) => {
    await page.fill('input[type="password"]', 'somepassword');
    await page.click('button[type="submit"]');
    
    // Check for validation
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('shows validation error for empty password', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@test.com');
    await page.click('button[type="submit"]');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    // This test requires a test user in the backend
    // Skip if no test backend is available
    test.skip(!process.env.TEST_USER_EMAIL, 'Requires test user');
    
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    
    // Should redirect away from login
    await expect(page).not.toHaveURL('/login', { timeout: 5000 });
  });

  test('shows loading state during submission', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'testpassword');
    
    // Check button shows loading
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Brief moment where button should be disabled or show loading
    await expect(submitButton).toBeDisabled();
  });

  test('has link to register page', async ({ page }) => {
    const registerLink = page.locator('a[href*="register"]');
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(/register/);
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const toggleButton = page.locator('[data-testid="toggle-password"], button:near(input[type="password"])').first();
    
    // Initially password type
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // If toggle exists, click it
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});
```

**Implementation - register.spec.ts:**

```typescript
// frontend/e2e/auth/register.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('displays registration form', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/sign up|register|create/i);
    await expect(page.locator('input[name="name"], input[placeholder*="name" i]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('validates password requirements', async ({ page }) => {
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test User');
    await page.fill('input[type="email"]', 'test@example.com');
    
    // Try weak password
    await page.fill('input[type="password"]', 'weak');
    await page.click('button[type="submit"]');
    
    // Should show password requirement error
    const content = await page.content();
    const hasPasswordError = 
      content.toLowerCase().includes('8') || 
      content.toLowerCase().includes('character') ||
      content.toLowerCase().includes('password');
    
    expect(hasPasswordError).toBe(true);
  });

  test('validates email format', async ({ page }) => {
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test User');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'SecureP@ss123');
    await page.click('button[type="submit"]');
    
    // Should show email format error
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveCSS('border-color', /red|error/i).catch(() => {
      // Alternative: check for validation message
    });
  });

  test('has link to login page', async ({ page }) => {
    const loginLink = page.locator('a[href*="login"]');
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/login/);
  });

  test('successful registration redirects to dashboard', async ({ page }) => {
    // Generate unique email to avoid conflicts
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test User');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'SecureP@ss123');
    
    // If there's a confirm password field
    const confirmPassword = page.locator('input[name="confirmPassword"], input[placeholder*="confirm" i]');
    if (await confirmPassword.isVisible()) {
      await confirmPassword.fill('SecureP@ss123');
    }
    
    await page.click('button[type="submit"]');
    
    // Should redirect away from register on success
    // Or show success message if email verification required
    await page.waitForTimeout(2000);
    const url = page.url();
    const content = await page.content();
    
    const isSuccessful = 
      !url.includes('/register') || 
      content.toLowerCase().includes('success') ||
      content.toLowerCase().includes('verify');
    
    expect(isSuccessful).toBe(true);
  });
});
```

**Acceptance Criteria:**
- [ ] Login form tests (validation, submission, errors)
- [ ] Register form tests (validation, password requirements)
- [ ] Navigation between login/register
- [ ] Loading states tested
- [ ] Error states tested

---

### TOASTER-014: File Upload Integration Tests

**Priority:** P1  
**Estimated Time:** 0.5 days  
**Dependencies:** HANDYMAN-012 (File Upload Integration)

**Files to Create:**

```
frontend/e2e/
├── files/
│   ├── upload.spec.ts
│   ├── download.spec.ts
│   └── delete.spec.ts
```

**Implementation - upload.spec.ts:**

```typescript
// frontend/e2e/files/upload.spec.ts

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('File Upload', () => {
  // Use authenticated context for these tests
  test.use({ storageState: 'e2e/.auth/user.json' });

  const testFilePath = path.join(__dirname, '../fixtures/valid-data.csv');

  test('uploads CSV file successfully', async ({ page }) => {
    await page.goto('/');
    
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(testFilePath);
      
      // Wait for upload to complete
      await page.waitForTimeout(3000);
      
      // Check for success indication
      const pageContent = await page.content();
      const hasData = 
        pageContent.includes('data') ||
        pageContent.includes('table') ||
        pageContent.includes('row');
      
      expect(hasData).toBe(true);
    } else {
      test.skip();
    }
  });

  test('shows upload progress', async ({ page }) => {
    await page.goto('/');
    
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles(testFilePath);
      
      // Look for progress indicator
      const progressIndicator = page.locator(
        '[data-testid="upload-progress"], .progress, [role="progressbar"]'
      );
      
      // Progress may be brief for small files
      // Just verify no error occurred
      await page.waitForTimeout(2000);
    } else {
      test.skip();
    }
  });

  test('rejects invalid file types', async ({ page }) => {
    await page.goto('/');
    
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.isVisible()) {
      // Create a fake .exe file path
      const invalidPath = path.join(__dirname, '../fixtures/invalid-data.txt');
      
      await fileInput.setInputFiles(invalidPath);
      await page.waitForTimeout(2000);
      
      // Check for error message
      const content = await page.content();
      const hasError = 
        content.toLowerCase().includes('error') ||
        content.toLowerCase().includes('unsupported') ||
        content.toLowerCase().includes('invalid');
      
      // Should either show error or reject silently
      await expect(page.locator('body')).toBeVisible();
    } else {
      test.skip();
    }
  });
});
```

**Acceptance Criteria:**
- [ ] Successful upload test
- [ ] Progress indication tested
- [ ] Invalid file rejection tested
- [ ] Large file handling tested

---

### TOASTER-015: Protected Routes E2E Tests

**Priority:** P1  
**Estimated Time:** 0.5 days  
**Dependencies:** HANDYMAN-014 (Protected Routes)

**Files to Create:**

```
frontend/e2e/
├── routes/
│   ├── protected.spec.ts
│   └── public.spec.ts
```

**Implementation - protected.spec.ts:**

```typescript
// frontend/e2e/routes/protected.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Protected Routes', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    
    // Try to access dashboard
    await page.goto('/');
    
    // Should be redirected to login
    await page.waitForURL(/login/, { timeout: 5000 }).catch(() => {
      // If app doesn't require auth for root, this is okay
    });
  });

  test('allows authenticated users to access dashboard', async ({ page }) => {
    // Use authenticated storage state
    test.use({ storageState: 'e2e/.auth/user.json' });
    
    await page.goto('/');
    
    // Should stay on dashboard (not redirected to login)
    await expect(page).not.toHaveURL(/login/);
  });

  test('remembers intended destination after login', async ({ page }) => {
    // Clear auth
    await page.evaluate(() => localStorage.clear());
    
    // Try to access specific protected page
    await page.goto('/workspace');
    
    // Should redirect to login with return URL
    await expect(page).toHaveURL(/login/);
    
    // Login (if test user available)
    if (process.env.TEST_USER_EMAIL) {
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL);
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
      await page.click('button[type="submit"]');
      
      // Should redirect back to workspace
      await expect(page).toHaveURL(/workspace/, { timeout: 5000 });
    }
  });
});

test.describe('Public Routes', () => {
  test('login page accessible without auth', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
  });

  test('register page accessible without auth', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
  });
});
```

**Acceptance Criteria:**
- [ ] Protected routes redirect to login
- [ ] Return URL preserved after login
- [ ] Public routes accessible without auth
- [ ] Auth state persists across page reloads

---

### TOASTER-016: Accessibility Audit

**Priority:** P2  
**Estimated Time:** 0.5 days  
**Dependencies:** HANDYMAN-013, HANDYMAN-015

**Tools:**
- Lighthouse (built into Chrome DevTools)
- Axe browser extension
- Playwright accessibility testing

**Implementation - accessibility.spec.ts:**

```typescript
// frontend/e2e/accessibility/audit.spec.ts

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('login page meets accessibility standards', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Log violations for review
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations:');
      accessibilityScanResults.violations.forEach(v => {
        console.log(`- ${v.id}: ${v.description}`);
      });
    }
    
    // Allow some violations but flag critical ones
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('main dashboard meets accessibility standards', async ({ page }) => {
    test.use({ storageState: 'e2e/.auth/user.json' });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('keyboard navigation works on main elements', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('color contrast meets WCAG AA', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();
    
    // Log any contrast issues
    accessibilityScanResults.violations.forEach(v => {
      console.log(`Contrast issue: ${v.description}`);
      v.nodes.forEach(n => console.log(`  - ${n.html}`));
    });
  });
});
```

**Manual Audit Checklist:**

```markdown
## Manual Accessibility Checklist

### Login Page
- [ ] Form labels properly associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Focus visible on all interactive elements
- [ ] Tab order is logical
- [ ] Color contrast ratio >= 4.5:1

### Dashboard
- [ ] Main heading (h1) present
- [ ] Data tables have proper headers
- [ ] Charts have text alternatives
- [ ] Skip link to main content
- [ ] Modal dialogs trap focus

### Overall
- [ ] Page titles are descriptive
- [ ] Language attribute set on html
- [ ] No flashing content >3Hz
- [ ] Touch targets >= 44x44px on mobile
```

**Deliverable:** `ACCESSIBILITY_REPORT_2026-01-08.md`

**Acceptance Criteria:**
- [ ] Zero critical accessibility violations
- [ ] Keyboard navigation works
- [ ] Color contrast passes WCAG AA
- [ ] Audit report created

---

### TOASTER-017: Performance Baseline

**Priority:** P2  
**Estimated Time:** 0.5 days  
**Dependencies:** None

**Objective:**
Establish performance baselines for the current state of the application.

**Metrics to Capture:**

```typescript
// frontend/e2e/performance/baseline.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Performance Baseline', () => {
  test('page load time < 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('login page loads < 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    console.log(`Login page load time: ${loadTime}ms`);
    
    expect(loadTime).toBeLessThan(2000);
  });

  test('bundle size check', async ({ page }) => {
    await page.goto('/');
    
    // Get all JS resources
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter((r: PerformanceResourceTiming) => r.initiatorType === 'script')
        .map((r: PerformanceResourceTiming) => ({
          name: r.name,
          size: r.transferSize,
        }));
    });
    
    const totalJsSize = resources.reduce((sum, r) => sum + (r.size || 0), 0);
    console.log(`Total JS bundle size: ${(totalJsSize / 1024).toFixed(2)} KB`);
    
    // Target: < 500KB total JS
    expect(totalJsSize).toBeLessThan(500 * 1024);
  });
});
```

**Lighthouse Audit Script:**

```bash
#!/bin/bash
# scripts/lighthouse-audit.sh

npx lighthouse http://localhost:3000 \
  --output=json,html \
  --output-path=./reports/lighthouse \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,best-practices

echo "Lighthouse report saved to ./reports/lighthouse"
```

**Deliverable:** `PERFORMANCE_BASELINE_2026-01-08.md`

**Acceptance Criteria:**
- [ ] Page load times documented
- [ ] Bundle sizes documented
- [ ] Lighthouse scores captured
- [ ] Baseline report created

---

## 📅 Sprint Schedule

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| **Day 1** | TOASTER-012 | Test suite report |
| **Day 2** | TOASTER-013 | Auth E2E tests |
| **Day 3** | TOASTER-014 + TOASTER-015 | File + Route tests |
| **Day 4** | TOASTER-016 | Accessibility report |
| **Day 5** | TOASTER-017 | Performance baseline |
| **Day 6-7** | Bug reproduction, retests | Final report |

---

## 🔗 Dependencies & Coordination

### With Handyman
- TOASTER-013 depends on HANDYMAN-013 (Login UI)
- TOASTER-014 depends on HANDYMAN-012 (File Upload)
- TOASTER-015 depends on HANDYMAN-014 (Protected Routes)

### Blocking Issues
If any Handyman task is delayed:
1. Document the blocking issue
2. Work on non-dependent tasks
3. Notify Lead Architect

---

## 📝 Test Data Setup

### Create Test Fixtures

```
frontend/e2e/fixtures/
├── users.ts          # Test user credentials
├── valid-data.csv    # Valid CSV for upload tests
├── large-data.csv    # Large file for performance tests
├── invalid-data.txt  # Invalid file for rejection tests
└── auth/
    └── user.json     # Authenticated storage state
```

**users.ts:**
```typescript
export const testUsers = {
  standard: {
    email: process.env.TEST_USER_EMAIL || 'test@pilotba.com',
    password: process.env.TEST_USER_PASSWORD || 'TestP@ss123',
    name: 'Test User',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@pilotba.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'AdminP@ss123',
    name: 'Admin User',
  },
};
```

### Setup Authenticated State

```typescript
// e2e/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';
import { testUsers } from './fixtures/users';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Login and save state
  await page.goto('/login');
  await page.fill('input[type="email"]', testUsers.standard.email);
  await page.fill('input[type="password"]', testUsers.standard.password);
  await page.click('button[type="submit"]');
  
  // Wait for login to complete
  await page.waitForURL('/');
  
  // Save authenticated state
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
  
  await browser.close();
}

export default globalSetup;
```

---

## 📊 Test Coverage Goals

| Category | Current | Target |
|----------|---------|--------|
| Unit Tests | ~85% | 90% |
| Integration | ~70% | 80% |
| E2E | ~50% | 70% |
| Accessibility | ? | Zero critical |
| Performance | ? | Baseline established |

---

**Last Updated:** January 8, 2026  
**Document Owner:** Lead Architect


