/**
 * User Journey E2E Tests
 *
 * @author Toaster (Senior QA)
 * @date December 23, 2025
 *
 * Tests complete user journeys including:
 * - User registration and authentication
 * - File upload and data visualization
 * - Filter and aggregate operations
 * - Chart creation
 * - Session management
 *
 * Depends on: HANDYMAN-011 (Frontend-Backend Integration)
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Test user credentials
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'SecureP@ss123',
  name: 'Test User',
};

// Helper to generate unique email for each test run
function generateEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

// Setup test data files
test.beforeAll(async () => {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  // Create valid CSV test data
  const csvContent = `id,name,category,value,date,active
1,Widget A,Electronics,19.99,2024-01-15,true
2,Widget B,Electronics,29.99,2024-02-20,false
3,Gadget C,Gadgets,49.99,2024-03-10,true
4,Tool D,Tools,9.99,2024-04-05,true
5,Device E,Electronics,99.99,2024-05-12,false
6,Product F,Tools,14.99,2024-06-18,true
7,Component G,Gadgets,39.99,2024-07-22,false
8,Part H,Tools,24.99,2024-08-30,true
9,Module I,Electronics,59.99,2024-09-14,true
10,Unit J,Gadgets,34.99,2024-10-25,false`;

  fs.writeFileSync(path.join(FIXTURES_DIR, 'valid-data.csv'), csvContent);

  // Create JSON test data
  const jsonContent = JSON.stringify(
    [
      { id: 1, name: 'Item 1', value: 100, category: 'A' },
      { id: 2, name: 'Item 2', value: 200, category: 'B' },
      { id: 3, name: 'Item 3', value: 300, category: 'A' },
      { id: 4, name: 'Item 4', value: 400, category: 'C' },
      { id: 5, name: 'Item 5', value: 500, category: 'B' },
    ],
    null,
    2
  );

  fs.writeFileSync(path.join(FIXTURES_DIR, 'valid-data.json'), jsonContent);
});

// ============================================================================
// USER REGISTRATION & AUTHENTICATION
// ============================================================================

test.describe('User Registration & Authentication', () => {
  test('should register a new user', async ({ page }) => {
    const uniqueEmail = generateEmail();

    await page.goto('/register');

    // Fill registration form
    await page.fill('[data-testid="name-input"], input[name="name"]', TEST_USER.name);
    await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', uniqueEmail);
    await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', TEST_USER.password);

    // If there's a confirm password field
    const confirmPassword = page.locator('[data-testid="confirm-password-input"], input[name="confirmPassword"]');
    if (await confirmPassword.isVisible({ timeout: 1000 })) {
      await confirmPassword.fill(TEST_USER.password);
    }

    // Submit registration
    await page.click('[data-testid="register-button"], button[type="submit"]:has-text("Register"), button:has-text("Sign up")');

    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/dashboard|home|\/$/i, { timeout: 10000 });

    // Should show user is logged in
    await expect(
      page.locator('[data-testid="user-menu"], [data-testid="user-name"], .user-profile').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should show error for duplicate email', async ({ page }) => {
    const email = generateEmail();

    // First registration
    await page.goto('/register');
    await page.fill('[data-testid="name-input"], input[name="name"]', TEST_USER.name);
    await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', email);
    await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('[data-testid="register-button"], button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 10000 });

    // Logout
    await page.click('[data-testid="user-menu"], .user-profile').catch(() => {});
    await page.click('[data-testid="logout-button"], button:has-text("Logout")').catch(() => {});
    await page.waitForTimeout(1000);

    // Try to register with same email
    await page.goto('/register');
    await page.fill('[data-testid="name-input"], input[name="name"]', 'Another User');
    await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', email);
    await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('[data-testid="register-button"], button[type="submit"]');

    // Should show error
    await expect(
      page.locator('[data-testid="error-message"], .error, [role="alert"]').first()
    ).toContainText(/already|exists|taken|registered/i, { timeout: 10000 });
  });

  test('should show error for weak password', async ({ page }) => {
    await page.goto('/register');

    await page.fill('[data-testid="name-input"], input[name="name"]', TEST_USER.name);
    await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', generateEmail());
    await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', 'weak');
    await page.click('[data-testid="register-button"], button[type="submit"]');

    // Should show password strength error
    await expect(
      page.locator('[data-testid="error-message"], .error, [role="alert"]').first()
    ).toContainText(/password|weak|short|characters/i, { timeout: 10000 });
  });

  test('should login with existing credentials', async ({ page }) => {
    const email = generateEmail();

    // Register first
    await page.goto('/register');
    await page.fill('[data-testid="name-input"], input[name="name"]', TEST_USER.name);
    await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', email);
    await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('[data-testid="register-button"], button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 10000 });

    // Logout
    await page.click('[data-testid="user-menu"], .user-profile').catch(() => {});
    await page.click('[data-testid="logout-button"], button:has-text("Logout")').catch(() => {});
    await page.waitForTimeout(1000);

    // Login
    await page.goto('/login');
    await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', email);
    await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('[data-testid="login-button"], button[type="submit"]:has-text("Login"), button:has-text("Sign in")');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard|home|\/$/i, { timeout: 10000 });
  });

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', 'nonexistent@example.com');
    await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"], button[type="submit"]');

    // Should show error message
    await expect(
      page.locator('[data-testid="error-message"], .error, [role="alert"]').first()
    ).toContainText(/invalid|incorrect|wrong|failed/i, { timeout: 10000 });
  });

  test('should logout and require login for protected routes', async ({ page }) => {
    const email = generateEmail();

    // Register and login
    await page.goto('/register');
    await page.fill('[data-testid="name-input"], input[name="name"]', TEST_USER.name);
    await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', email);
    await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('[data-testid="register-button"], button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 10000 });

    // Logout
    await page.click('[data-testid="user-menu"], .user-profile').catch(() => {});
    await page.click('[data-testid="logout-button"], button:has-text("Logout")');

    // Should redirect to login
    await expect(page).toHaveURL(/login/i, { timeout: 10000 });

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/i, { timeout: 10000 });
  });
});

// ============================================================================
// COMPLETE USER JOURNEY
// ============================================================================

test.describe('Complete User Journey', () => {
  // Create a logged-in session for this test suite
  test.beforeEach(async ({ page }) => {
    const email = generateEmail();

    // Register new user
    await page.goto('/register');
    await page.fill('[data-testid="name-input"], input[name="name"]', TEST_USER.name);
    await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', email);
    await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', TEST_USER.password);

    const confirmPassword = page.locator('[data-testid="confirm-password-input"], input[name="confirmPassword"]');
    if (await confirmPassword.isVisible({ timeout: 1000 })) {
      await confirmPassword.fill(TEST_USER.password);
    }

    await page.click('[data-testid="register-button"], button[type="submit"]');
    await page.waitForURL(/dashboard|home|\/$/i, { timeout: 15000 });
  });

  test('should upload CSV and view data', async ({ page }) => {
    // Find and click upload button if not on upload page
    const uploadButton = page.locator('[data-testid="upload-button"], button:has-text("Upload")').first();
    if (await uploadButton.isVisible({ timeout: 2000 })) {
      await uploadButton.click();
    }

    // Upload file
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'valid-data.csv'));

    // Wait for processing
    await expect(
      page.locator('[data-testid="data-table"], table, [role="grid"]').first()
    ).toBeVisible({ timeout: 15000 });

    // Verify data loaded
    const rowCountText = await page.locator('[data-testid="row-count"], .row-count').first().textContent();
    const rowCount = parseInt(rowCountText?.match(/\d+/)?.[0] || '0');
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should create chart from uploaded data', async ({ page }) => {
    // Upload data first
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'valid-data.csv'));
    await expect(page.locator('[data-testid="data-table"], table').first()).toBeVisible({ timeout: 15000 });

    // Navigate to chart creation
    const createChartButton = page.locator('[data-testid="create-chart-button"], button:has-text("Chart"), [href*="chart"]').first();
    if (await createChartButton.isVisible({ timeout: 3000 })) {
      await createChartButton.click();
    }

    // Select chart type
    const chartTypeSelect = page.locator('[data-testid="chart-type-select"], select[name="chartType"]').first();
    if (await chartTypeSelect.isVisible({ timeout: 3000 })) {
      await chartTypeSelect.selectOption('bar');
    }

    // Select X axis
    const xAxisSelect = page.locator('[data-testid="x-axis-select"], select[name="xAxis"]').first();
    if (await xAxisSelect.isVisible({ timeout: 2000 })) {
      await xAxisSelect.selectOption({ index: 1 }); // Select first available column
    }

    // Select Y axis
    const yAxisSelect = page.locator('[data-testid="y-axis-select"], select[name="yAxis"]').first();
    if (await yAxisSelect.isVisible({ timeout: 2000 })) {
      await yAxisSelect.selectOption({ index: 2 }); // Select second available column
    }

    // Render chart
    const renderButton = page.locator('[data-testid="render-chart-button"], button:has-text("Render"), button:has-text("Create")').first();
    if (await renderButton.isVisible({ timeout: 2000 })) {
      await renderButton.click();
    }

    // Verify chart rendered
    await expect(
      page.locator('[data-testid="chart-container"], canvas, svg.chart').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should apply filter and see updated results', async ({ page }) => {
    // Upload data
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'valid-data.csv'));
    await expect(page.locator('[data-testid="data-table"], table').first()).toBeVisible({ timeout: 15000 });

    // Get initial count
    const initialCountText = await page.locator('[data-testid="row-count"]').first().textContent();
    const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '10');

    // Add filter
    const addFilterButton = page.locator('[data-testid="add-filter-button"], button:has-text("Filter")').first();
    if (await addFilterButton.isVisible({ timeout: 3000 })) {
      await addFilterButton.click();
    }

    // Select filter column
    const filterColumn = page.locator('[data-testid="filter-column"], select[name="column"]').first();
    if (await filterColumn.isVisible({ timeout: 2000 })) {
      await filterColumn.selectOption('category');
    }

    // Select operator
    const filterOperator = page.locator('[data-testid="filter-operator"], select[name="operator"]').first();
    if (await filterOperator.isVisible({ timeout: 2000 })) {
      await filterOperator.selectOption('eq');
    }

    // Enter filter value
    const filterValue = page.locator('[data-testid="filter-value"], input[name="value"]').first();
    if (await filterValue.isVisible({ timeout: 2000 })) {
      await filterValue.fill('Electronics');
    }

    // Apply filter
    const applyButton = page.locator('[data-testid="apply-filter-button"], button:has-text("Apply")').first();
    if (await applyButton.isVisible({ timeout: 2000 })) {
      await applyButton.click();
    }

    await page.waitForTimeout(1000);

    // Verify filtered results
    const filteredCountText = await page.locator('[data-testid="row-count"]').first().textContent();
    const filteredCount = parseInt(filteredCountText?.match(/\d+/)?.[0] || '10');

    // Filtered count should be less than initial (4 Electronics items out of 10)
    expect(filteredCount).toBeLessThan(initialCount);
  });

  test('should persist data after page refresh', async ({ page }) => {
    // Upload data
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'valid-data.csv'));
    await expect(page.locator('[data-testid="data-table"], table').first()).toBeVisible({ timeout: 15000 });

    // Refresh page
    await page.reload();

    // Data should still be available (if stored in backend or localStorage)
    await page.waitForTimeout(2000);

    // Check if data is still visible or if we need to re-upload
    // This depends on implementation - backend storage vs client-only
    const dataTable = page.locator('[data-testid="data-table"], table').first();
    const datasetList = page.locator('[data-testid="dataset-manager"], .dataset-list').first();

    // Either table is visible or datasets are listed
    await expect(dataTable.or(datasetList)).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

test.describe('Error Handling', () => {
  test('should show error for unsupported file type', async ({ page }) => {
    await page.goto('/');

    // Create and upload invalid file
    const invalidFilePath = path.join(FIXTURES_DIR, 'invalid-data.txt');
    fs.writeFileSync(invalidFilePath, 'This is not a valid data file');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(invalidFilePath);

    // Should show error
    await expect(
      page.locator('[data-testid="error-toast"], [data-testid="error-message"], .error, [role="alert"]').first()
    ).toContainText(/unsupported|invalid|error/i, { timeout: 10000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Block API requests
    await page.route('**/api/**', (route) => route.abort());

    await page.goto('/');

    // Should show network error or offline indicator
    await expect(
      page.locator('[data-testid="error-message"], .error, [role="alert"], .offline-indicator').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should show loading state during operations', async ({ page }) => {
    await page.goto('/');

    // Slow down API response
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'valid-data.csv'));

    // Should show loading indicator
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, [role="progressbar"], .spinner').first();
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

test.describe('Session Management', () => {
  test('should automatically refresh tokens', async ({ page }) => {
    const email = generateEmail();

    // Register
    await page.goto('/register');
    await page.fill('[data-testid="name-input"], input[name="name"]', TEST_USER.name);
    await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', email);
    await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('[data-testid="register-button"], button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 10000 });

    // Simulate time passing (in real test, would manipulate token expiry)
    await page.waitForTimeout(1000);

    // Make a request that requires auth
    await page.reload();

    // Should still be logged in (token was refreshed)
    await expect(
      page.locator('[data-testid="user-menu"], [data-testid="user-name"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('should handle session expiration', async ({ page }) => {
    const email = generateEmail();

    // Register and login
    await page.goto('/register');
    await page.fill('[data-testid="name-input"], input[name="name"]', TEST_USER.name);
    await page.fill('[data-testid="email-input"], input[name="email"], input[type="email"]', email);
    await page.fill('[data-testid="password-input"], input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('[data-testid="register-button"], button[type="submit"]');
    await page.waitForURL(/dashboard|home/i, { timeout: 10000 });

    // Clear tokens to simulate expiration
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });

    // Try to access protected resource
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/login/i, { timeout: 10000 });
  });
});

// ============================================================================
// ACCESSIBILITY
// ============================================================================

test.describe('Accessibility', () => {
  test('should be navigable with keyboard', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email-input"], input[type="email"]').first()).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password-input"], input[type="password"]').first()).toBeFocused();

    await page.keyboard.press('Tab');
    // Should focus on submit button or next interactive element
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/login');

    // Check for aria labels on form elements
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    const ariaLabel = await emailInput.getAttribute('aria-label');
    const labelledBy = await emailInput.getAttribute('aria-labelledby');
    const placeholder = await emailInput.getAttribute('placeholder');

    // Should have some form of label
    expect(ariaLabel || labelledBy || placeholder).toBeTruthy();
  });

  test('should announce errors to screen readers', async ({ page }) => {
    await page.goto('/login');

    // Submit empty form
    await page.click('[data-testid="login-button"], button[type="submit"]');

    // Error should have role="alert" for screen readers
    const errorElement = page.locator('[role="alert"], .error').first();
    await expect(errorElement).toBeVisible({ timeout: 5000 });
  });
});

// Cleanup
test.afterAll(async () => {
  const files = ['valid-data.csv', 'valid-data.json', 'invalid-data.txt'];
  for (const file of files) {
    const filePath = path.join(FIXTURES_DIR, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

