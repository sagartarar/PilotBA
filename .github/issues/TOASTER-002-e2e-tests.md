# [TOASTER] E2E Tests with Playwright

**Assigned to:** Toaster (Senior QA)  
**Date:** December 17, 2025  
**Priority:** High  
**Estimated Time:** 4 hours  
**Labels:** `toaster`, `testing`, `e2e`, `priority:high`

---

## Objective
Create end-to-end tests for critical user workflows using Playwright.

---

## Tasks

### T6: File Upload Workflow
**File:** `frontend/e2e/file-upload.spec.ts`

**Test Scenarios:**
- [ ] Upload CSV file via drag-and-drop
- [ ] Upload CSV file via file picker
- [ ] Upload JSON file
- [ ] Reject invalid file types (PDF, DOCX)
- [ ] Show progress indicator during upload
- [ ] Display success notification after upload
- [ ] File appears in dataset list after upload
- [ ] Large file upload (10MB+)

**Test Steps:**
```typescript
test('upload CSV file via drag-and-drop', async ({ page }) => {
  await page.goto('/');
  
  // Create test file
  const csvContent = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
  
  // Drag and drop
  const dropZone = page.locator('[data-testid="file-dropzone"]');
  await dropZone.dispatchEvent('drop', {
    dataTransfer: { files: [new File([csvContent], 'test.csv')] }
  });
  
  // Verify upload success
  await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  await expect(page.locator('[data-testid="dataset-list"]')).toContainText('test.csv');
});
```

---

### T7: Data Table Interaction
**File:** `frontend/e2e/data-table.spec.ts`

**Test Scenarios:**
- [ ] Table displays uploaded data correctly
- [ ] Column sorting (ascending/descending)
- [ ] Column filtering
- [ ] Pagination works
- [ ] Export to CSV downloads file
- [ ] Virtual scrolling with large datasets
- [ ] Column resize

**Performance Assertions:**
- Table renders within 500ms for 10K rows
- Sorting completes within 100ms
- Filtering completes within 50ms

---

### T8: Chart Creation Workflow
**File:** `frontend/e2e/chart-creation.spec.ts`

**Test Scenarios:**
- [ ] Create scatter plot from data
- [ ] Create bar chart from data
- [ ] Configure X and Y axes
- [ ] Apply color encoding
- [ ] Chart renders correctly
- [ ] Zoom and pan interactions
- [ ] Hover shows tooltip

**Test Steps:**
```typescript
test('create scatter plot', async ({ page }) => {
  // Upload data first
  await uploadTestData(page, 'sales.csv');
  
  // Navigate to chart creation
  await page.click('[data-testid="create-chart-btn"]');
  
  // Configure chart
  await page.selectOption('[data-testid="chart-type"]', 'scatter');
  await page.selectOption('[data-testid="x-axis"]', 'price');
  await page.selectOption('[data-testid="y-axis"]', 'quantity');
  
  // Create chart
  await page.click('[data-testid="create-chart-submit"]');
  
  // Verify chart rendered
  await expect(page.locator('canvas')).toBeVisible();
});
```

---

### T9: Dashboard Workflow
**File:** `frontend/e2e/dashboard.spec.ts`

**Test Scenarios:**
- [ ] Add multiple charts to dashboard
- [ ] Drag chart to new position
- [ ] Resize chart
- [ ] Save dashboard layout
- [ ] Reload page and verify layout persisted
- [ ] Delete chart from dashboard
- [ ] Reset layout to default

---

### T10: Query Builder Workflow
**File:** `frontend/e2e/query-builder.spec.ts`

**Test Scenarios:**
- [ ] Add filter condition
- [ ] Multiple filter conditions with AND
- [ ] Multiple filter conditions with OR
- [ ] Apply filters updates data table
- [ ] Apply filters updates charts
- [ ] Reset filters restores original data
- [ ] Complex filter combinations

---

### T11: Theme and Accessibility
**File:** `frontend/e2e/accessibility.spec.ts`

**Test Scenarios:**
- [ ] Toggle between light/dark themes
- [ ] Theme persists across page refresh
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Screen reader compatibility (axe-core)

**Accessibility Tests:**
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('no accessibility violations on main page', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

---

## Technical Notes

### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Data Files
Create test data files in `frontend/e2e/fixtures/`:
- `small.csv` - 100 rows
- `medium.csv` - 10,000 rows
- `large.csv` - 100,000 rows
- `sample.json` - JSON array format

### Running E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test file-upload.spec.ts

# Debug mode
npm run test:e2e:debug
```

---

## Definition of Done
- [ ] 6 E2E test files created
- [ ] All tests passing on Chrome, Firefox, Safari
- [ ] Performance assertions included
- [ ] Accessibility tests passing
- [ ] Test data fixtures created
- [ ] No flaky tests
- [ ] HTML report generated

---

## References
- Playwright Docs: https://playwright.dev/
- Axe-core: https://github.com/dequelabs/axe-core
- Existing Config: `frontend/playwright.config.ts`

