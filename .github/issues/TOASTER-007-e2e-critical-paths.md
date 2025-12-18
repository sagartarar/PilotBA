# 🍞 TOASTER-007: E2E Critical Path Tests

**Priority:** P1
**Time Estimate:** 1 day
**Depends On:** TOASTER-005 (Test Runner Fix)

---

## 📋 Objective

Create E2E tests for critical user flows using Playwright.

---

## 🎯 Critical Paths to Test

1. **File Upload Flow** - Upload CSV → See data in table
2. **Chart Creation Flow** - Select data → Create chart → See visualization
3. **Query Flow** - Add filter → See filtered results
4. **Error Handling** - Invalid file → See error message
5. **Export Flow** - Filter data → Export CSV

---

## 📁 Files to Create

```
frontend/e2e/
├── critical-paths.spec.ts
├── fixtures/
│   ├── valid-data.csv
│   ├── large-data.csv
│   └── invalid-data.txt
└── utils/
    └── helpers.ts
```

---

## 🔧 Implementation

### Step 1: Create Test Fixtures

**`fixtures/valid-data.csv`**
```csv
id,name,value,category
1,Item A,100,Electronics
2,Item B,200,Clothing
3,Item C,150,Electronics
4,Item D,300,Food
5,Item E,250,Clothing
```

### Step 2: Create Helper Functions (`utils/helpers.ts`)

```typescript
import { Page, expect } from '@playwright/test';

export async function uploadFile(page: Page, filePath: string) {
  const fileInput = page.locator('[data-testid="file-input"]');
  await fileInput.setInputFiles(filePath);
  await page.waitForSelector('[data-testid="data-table"]', { timeout: 10000 });
}

export async function waitForChartRender(page: Page) {
  await page.waitForSelector('canvas', { timeout: 10000 });
  // Wait for WebGL to render
  await page.waitForTimeout(500);
}

export async function getRowCount(page: Page): Promise<number> {
  const rows = await page.locator('[data-testid="data-table"] tbody tr').count();
  return rows;
}
```

### Step 3: Create Critical Path Tests (`critical-paths.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';
import { uploadFile, waitForChartRender, getRowCount } from './utils/helpers';
import path from 'path';

test.describe('Critical User Paths', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. Upload CSV and view data', async ({ page }) => {
    // Upload file
    await uploadFile(page, path.join(__dirname, 'fixtures/valid-data.csv'));
    
    // Verify table is visible
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
    
    // Verify row count
    const rowCount = await getRowCount(page);
    expect(rowCount).toBe(5);
    
    // Verify column headers
    await expect(page.locator('th:has-text("id")')).toBeVisible();
    await expect(page.locator('th:has-text("name")')).toBeVisible();
    await expect(page.locator('th:has-text("value")')).toBeVisible();
  });

  test('2. Create chart from data', async ({ page }) => {
    // Upload file first
    await uploadFile(page, path.join(__dirname, 'fixtures/valid-data.csv'));
    
    // Navigate to dashboard
    await page.click('[data-testid="nav-dashboard"]');
    
    // Click create chart
    await page.click('[data-testid="create-chart"]');
    
    // Select chart type
    await page.click('[data-testid="chart-type-bar"]');
    
    // Configure axes
    await page.selectOption('[data-testid="x-axis-select"]', 'category');
    await page.selectOption('[data-testid="y-axis-select"]', 'value');
    
    // Apply
    await page.click('[data-testid="apply-chart-config"]');
    
    // Verify chart renders
    await waitForChartRender(page);
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('3. Filter data and verify results', async ({ page }) => {
    // Upload file
    await uploadFile(page, path.join(__dirname, 'fixtures/valid-data.csv'));
    
    // Navigate to query builder
    await page.click('[data-testid="nav-query"]');
    
    // Add filter
    await page.click('[data-testid="add-filter"]');
    await page.selectOption('[data-testid="filter-column"]', 'category');
    await page.selectOption('[data-testid="filter-operator"]', 'eq');
    await page.fill('[data-testid="filter-value"]', 'Electronics');
    
    // Execute query
    await page.click('[data-testid="execute-query"]');
    
    // Verify filtered count
    await expect(page.locator('[data-testid="result-count"]')).toHaveText('2 rows');
  });

  test('4. Error handling - invalid file type', async ({ page }) => {
    // Try to upload invalid file
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures/invalid-data.txt'));
    
    // Verify error toast appears
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-toast"]')).toContainText('Unsupported');
  });

  test('5. Error handling - large file warning', async ({ page }) => {
    // This test would need a large file fixture
    // For now, test the UI shows appropriate messaging
    
    // Mock a large file scenario or skip in CI
    test.skip(process.env.CI === 'true', 'Skipped in CI - needs large file');
  });

  test('6. Export filtered data', async ({ page }) => {
    // Upload and filter
    await uploadFile(page, path.join(__dirname, 'fixtures/valid-data.csv'));
    await page.click('[data-testid="nav-query"]');
    await page.click('[data-testid="add-filter"]');
    await page.selectOption('[data-testid="filter-column"]', 'value');
    await page.selectOption('[data-testid="filter-operator"]', 'gt');
    await page.fill('[data-testid="filter-value"]', '200');
    await page.click('[data-testid="execute-query"]');
    
    // Export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-csv"]'),
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('7. Responsive - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Upload file
    await uploadFile(page, path.join(__dirname, 'fixtures/valid-data.csv'));
    
    // Verify table is scrollable
    await expect(page.locator('[data-testid="data-table"]')).toBeVisible();
    
    // Verify sidebar is collapsed
    await expect(page.locator('[data-testid="sidebar"]')).toHaveAttribute('data-collapsed', 'true');
  });

});
```

### Step 4: Configure Playwright (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Step 5: Add Scripts to package.json

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

---

## ✅ Acceptance Criteria

- [ ] All 7 critical path tests pass
- [ ] Tests run in <2 minutes total
- [ ] Screenshots captured on failure
- [ ] Tests work in CI pipeline
- [ ] Mobile viewport test passes

---

## 📊 Test Coverage Report

After running, generate report:

```bash
npx playwright show-report
```

Expected output:
```
  Critical User Paths
    ✓ 1. Upload CSV and view data (2.3s)
    ✓ 2. Create chart from data (3.1s)
    ✓ 3. Filter data and verify results (2.8s)
    ✓ 4. Error handling - invalid file type (1.2s)
    ○ 5. Error handling - large file warning (skipped)
    ✓ 6. Export filtered data (2.5s)
    ✓ 7. Responsive - mobile viewport (1.8s)

  6 passed, 1 skipped (13.7s)
```

---

## 🏷️ Labels

`toaster` `priority-p1` `e2e` `testing` `playwright`

