/**
 * E2E Test Helpers
 *
 * Utility functions for Playwright E2E tests.
 *
 * @author Toaster (Senior QA Engineer)
 */
import { Page, expect } from "@playwright/test";
import path from "path";

/**
 * Upload a file via the file input
 */
export async function uploadFile(page: Page, filePath: string): Promise<void> {
  // Look for file input - try multiple selectors
  const fileInput = page.locator(
    '[data-testid="file-input"], input[type="file"]'
  );

  // Set the file
  await fileInput.setInputFiles(filePath);

  // Wait for processing
  await page.waitForTimeout(1000);
}

/**
 * Wait for data table to be visible
 */
export async function waitForDataTable(page: Page): Promise<void> {
  await page.waitForSelector(
    '[data-testid="data-table"], .data-table, table',
    { timeout: 10000 }
  );
}

/**
 * Wait for chart to render
 */
export async function waitForChartRender(page: Page): Promise<void> {
  await page.waitForSelector("canvas, svg", { timeout: 10000 });
  // Wait for WebGL to render
  await page.waitForTimeout(500);
}

/**
 * Get row count from data table
 */
export async function getRowCount(page: Page): Promise<number> {
  const rows = await page
    .locator('[data-testid="data-table"] tbody tr, .data-table tbody tr')
    .count();
  return rows;
}

/**
 * Navigate to a specific view
 */
export async function navigateTo(
  page: Page,
  view: "dashboard" | "data" | "query" | "settings"
): Promise<void> {
  const navSelectors: Record<string, string> = {
    dashboard:
      '[data-testid="nav-dashboard"], [href="/dashboard"], button:has-text("Dashboard")',
    data: '[data-testid="nav-data"], [href="/data"], button:has-text("Data")',
    query:
      '[data-testid="nav-query"], [href="/query"], button:has-text("Query")',
    settings:
      '[data-testid="nav-settings"], [href="/settings"], button:has-text("Settings")',
  };

  const selector = navSelectors[view];
  const navItem = page.locator(selector).first();

  if (await navItem.isVisible()) {
    await navItem.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Add a filter in the query builder
 */
export async function addFilter(
  page: Page,
  column: string,
  operator: string,
  value: string
): Promise<void> {
  // Click add filter button
  await page
    .locator('[data-testid="add-filter"], button:has-text("Add Filter")')
    .click();

  // Select column
  await page
    .locator('[data-testid="filter-column"], select[name="column"]')
    .last()
    .selectOption(column);

  // Select operator
  await page
    .locator('[data-testid="filter-operator"], select[name="operator"]')
    .last()
    .selectOption(operator);

  // Enter value
  await page
    .locator('[data-testid="filter-value"], input[name="value"]')
    .last()
    .fill(value);
}

/**
 * Execute query
 */
export async function executeQuery(page: Page): Promise<void> {
  await page
    .locator(
      '[data-testid="execute-query"], button:has-text("Execute"), button:has-text("Apply")'
    )
    .click();
  await page.waitForTimeout(1000);
}

/**
 * Check if error toast is visible
 */
export async function isErrorVisible(page: Page): Promise<boolean> {
  const errorToast = page.locator(
    '[data-testid="error-toast"], .toast-error, .error-message, [role="alert"]'
  );
  return await errorToast.isVisible().catch(() => false);
}

/**
 * Get error message text
 */
export async function getErrorMessage(page: Page): Promise<string | null> {
  const errorToast = page.locator(
    '[data-testid="error-toast"], .toast-error, .error-message, [role="alert"]'
  );

  if (await errorToast.isVisible()) {
    return await errorToast.textContent();
  }
  return null;
}

/**
 * Take a screenshot for debugging
 */
export async function takeDebugScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({
    path: `test-results/debug-${name}-${Date.now()}.png`,
    fullPage: true,
  });
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page): Promise<void> {
  // Wait for any loading indicators to disappear
  const loadingIndicator = page.locator(
    '.loading, [data-loading="true"], .spinner'
  );

  if (await loadingIndicator.isVisible()) {
    await loadingIndicator.waitFor({ state: "hidden", timeout: 30000 });
  }
}

/**
 * Get the fixtures directory path
 */
export function getFixturePath(filename: string): string {
  return path.join(__dirname, "..", "fixtures", filename);
}

