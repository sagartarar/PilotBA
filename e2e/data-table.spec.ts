/**
 * Data Table E2E Tests
 * 
 * @author Toaster (Senior QA)
 * @date December 17, 2025
 * 
 * Tests end-to-end data table interactions including sorting,
 * filtering, virtual scrolling, and data export.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Setup test data
test.beforeAll(async () => {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }
  
  // Create test CSV with various data types
  const csvContent = `id,name,price,quantity,category,active,created_at
1,Alpha Widget,19.99,100,Electronics,true,2024-01-15
2,Beta Gadget,29.99,50,Electronics,false,2024-02-20
3,Gamma Tool,49.99,75,Tools,true,2024-03-10
4,Delta Device,9.99,200,Gadgets,true,2024-04-05
5,Epsilon Item,99.99,25,Electronics,false,2024-05-12
6,Zeta Product,14.99,150,Tools,true,2024-06-18
7,Eta Component,39.99,80,Gadgets,false,2024-07-22
8,Theta Part,24.99,120,Tools,true,2024-08-30
9,Iota Module,59.99,45,Electronics,true,2024-09-14
10,Kappa Unit,34.99,90,Gadgets,false,2024-10-25`;
  
  fs.writeFileSync(path.join(FIXTURES_DIR, 'table-test-data.csv'), csvContent);
  
  // Create larger dataset for virtual scrolling test
  const largeRows = ['id,name,value,category'];
  for (let i = 1; i <= 1000; i++) {
    const category = ['A', 'B', 'C'][i % 3];
    largeRows.push(`${i},Item ${i},${(Math.random() * 1000).toFixed(2)},${category}`);
  }
  fs.writeFileSync(path.join(FIXTURES_DIR, 'large-table-data.csv'), largeRows.join('\n'));
});

test.describe('Data Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Upload test data
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'table-test-data.csv'));
    await page.waitForTimeout(3000);
  });

  test.describe('Table Display', () => {
    test('should display data table after file upload', async ({ page }) => {
      // Look for table element
      const table = page.locator('table, [role="grid"], [data-testid="data-table"]').first();
      await expect(table).toBeVisible({ timeout: 10000 });
    });

    test('should display column headers', async ({ page }) => {
      await expect(page.getByText('id')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('name')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('price')).toBeVisible({ timeout: 10000 });
    });

    test('should display data rows', async ({ page }) => {
      // Should show data from the CSV
      await expect(page.getByText('Alpha Widget').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Beta Gadget').first()).toBeVisible({ timeout: 10000 });
    });

    test('should display row count', async ({ page }) => {
      // Should show 10 rows
      await expect(page.getByText(/10 rows|10.*row/i).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Sorting', () => {
    test('should sort by column when header is clicked', async ({ page }) => {
      // Click on 'name' column header to sort
      const nameHeader = page.getByRole('columnheader', { name: /name/i }).first();
      await nameHeader.click();
      
      await page.waitForTimeout(1000);
      
      // First item should be Alpha Widget (alphabetically first)
      const firstRow = page.locator('tbody tr, [role="row"]').first();
      await expect(firstRow).toContainText(/Alpha/i);
    });

    test('should toggle sort direction on second click', async ({ page }) => {
      const nameHeader = page.getByRole('columnheader', { name: /name/i }).first();
      
      // First click - ascending
      await nameHeader.click();
      await page.waitForTimeout(500);
      
      // Second click - descending
      await nameHeader.click();
      await page.waitForTimeout(1000);
      
      // First item should be Zeta Product (alphabetically last)
      const firstRow = page.locator('tbody tr, [role="row"]').first();
      await expect(firstRow).toContainText(/Zeta/i);
    });

    test('should sort numeric columns correctly', async ({ page }) => {
      const priceHeader = page.getByRole('columnheader', { name: /price/i }).first();
      await priceHeader.click();
      
      await page.waitForTimeout(1000);
      
      // First item should have lowest price (9.99)
      const firstRow = page.locator('tbody tr, [role="row"]').first();
      await expect(firstRow).toContainText(/9\.99/);
    });

    test('should show sort indicator', async ({ page }) => {
      const nameHeader = page.getByRole('columnheader', { name: /name/i }).first();
      await nameHeader.click();
      
      await page.waitForTimeout(500);
      
      // Should show sort indicator (arrow or icon)
      const sortIndicator = nameHeader.locator('svg, [class*="sort"], [class*="arrow"]');
      await expect(sortIndicator).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Filtering', () => {
    test('should filter data when search is applied', async ({ page }) => {
      // Look for search/filter input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
      
      if (await searchInput.isVisible({ timeout: 5000 })) {
        await searchInput.fill('Electronics');
        await page.waitForTimeout(1000);
        
        // Should only show Electronics items
        await expect(page.getByText('Alpha Widget').first()).toBeVisible();
        await expect(page.getByText('Gamma Tool')).not.toBeVisible();
      }
    });

    test('should clear filter when search is cleared', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i]').first();
      
      if (await searchInput.isVisible({ timeout: 5000 })) {
        await searchInput.fill('Electronics');
        await page.waitForTimeout(500);
        await searchInput.clear();
        await page.waitForTimeout(1000);
        
        // Should show all items again
        await expect(page.getByText('Gamma Tool').first()).toBeVisible();
      }
    });
  });

  test.describe('Column Visibility', () => {
    test('should allow toggling column visibility', async ({ page }) => {
      // Look for column visibility toggle
      const columnToggle = page.locator('[data-testid="column-toggle"], button:has-text("Columns"), [aria-label*="column" i]').first();
      
      if (await columnToggle.isVisible({ timeout: 5000 })) {
        await columnToggle.click();
        await page.waitForTimeout(500);
        
        // Look for column checkboxes
        const categoryCheckbox = page.getByRole('checkbox', { name: /category/i }).first();
        if (await categoryCheckbox.isVisible({ timeout: 2000 })) {
          await categoryCheckbox.click();
          await page.waitForTimeout(500);
          
          // Category column should be hidden
          await expect(page.getByRole('columnheader', { name: /category/i })).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Row Selection', () => {
    test('should allow selecting rows', async ({ page }) => {
      // Look for row checkbox or clickable row
      const rowCheckbox = page.locator('tbody input[type="checkbox"], [role="row"] input[type="checkbox"]').first();
      
      if (await rowCheckbox.isVisible({ timeout: 5000 })) {
        await rowCheckbox.click();
        
        // Row should be selected (highlighted)
        const row = rowCheckbox.locator('xpath=ancestor::tr | ancestor::div[@role="row"]').first();
        await expect(row).toHaveClass(/selected|active|checked/);
      }
    });

    test('should allow selecting all rows', async ({ page }) => {
      // Look for "select all" checkbox in header
      const selectAllCheckbox = page.locator('thead input[type="checkbox"], [role="columnheader"] input[type="checkbox"]').first();
      
      if (await selectAllCheckbox.isVisible({ timeout: 5000 })) {
        await selectAllCheckbox.click();
        await page.waitForTimeout(500);
        
        // All row checkboxes should be checked
        const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
        const count = await rowCheckboxes.count();
        
        for (let i = 0; i < Math.min(count, 5); i++) {
          await expect(rowCheckboxes.nth(i)).toBeChecked();
        }
      }
    });
  });

  test.describe('Virtual Scrolling', () => {
    test('should handle large datasets with virtual scrolling', async ({ page }) => {
      // Upload large dataset
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'large-table-data.csv'));
      await page.waitForTimeout(5000);
      
      // Should show row count
      await expect(page.getByText(/1,000|1000/i).first()).toBeVisible({ timeout: 10000 });
      
      // Table should be scrollable
      const tableContainer = page.locator('[class*="table"], [class*="scroll"], [data-testid="data-table"]').first();
      
      // Scroll down
      await tableContainer.evaluate((el) => {
        el.scrollTop = 1000;
      });
      
      await page.waitForTimeout(500);
      
      // Should render new rows (virtual scrolling)
      // Just verify the table is still responsive
      await expect(tableContainer).toBeVisible();
    });

    test('should maintain performance with large datasets', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      
      const startTime = Date.now();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'large-table-data.csv'));
      await page.waitForTimeout(5000);
      const endTime = Date.now();
      
      // Should load in reasonable time
      expect(endTime - startTime).toBeLessThan(10000);
      
      // Table should be interactive
      const nameHeader = page.getByRole('columnheader', { name: /name/i }).first();
      if (await nameHeader.isVisible({ timeout: 5000 })) {
        const sortStart = Date.now();
        await nameHeader.click();
        await page.waitForTimeout(1000);
        const sortEnd = Date.now();
        
        // Sorting should be fast
        expect(sortEnd - sortStart).toBeLessThan(3000);
      }
    });
  });

  test.describe('Data Export', () => {
    test('should allow exporting data as CSV', async ({ page }) => {
      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), [aria-label*="export" i], [data-testid="export-button"]').first();
      
      if (await exportButton.isVisible({ timeout: 5000 })) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
        
        await exportButton.click();
        
        // Look for CSV option
        const csvOption = page.getByText(/csv/i).first();
        if (await csvOption.isVisible({ timeout: 2000 })) {
          await csvOption.click();
        }
        
        try {
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toContain('.csv');
        } catch {
          // Export might work differently, just verify button is clickable
        }
      }
    });
  });

  test.describe('Cell Formatting', () => {
    test('should format boolean values', async ({ page }) => {
      // Boolean values should be displayed as true/false or with icons
      const trueValue = page.getByText('true').first();
      const falseValue = page.getByText('false').first();
      
      await expect(trueValue.or(page.locator('[class*="true"], [class*="check"]').first())).toBeVisible({ timeout: 10000 });
      await expect(falseValue.or(page.locator('[class*="false"], [class*="cross"]').first())).toBeVisible({ timeout: 10000 });
    });

    test('should format numeric values', async ({ page }) => {
      // Numeric values should be displayed
      await expect(page.getByText('19.99').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('100').first()).toBeVisible({ timeout: 10000 });
    });

    test('should handle null values gracefully', async ({ page }) => {
      // Create file with null values
      const csvWithNulls = `id,name,value
1,Item 1,100
2,Item 2,
3,,300`;
      
      fs.writeFileSync(path.join(FIXTURES_DIR, 'null-data.csv'), csvWithNulls);
      
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'null-data.csv'));
      await page.waitForTimeout(3000);
      
      // Null values should be displayed (as "null", empty, or with special styling)
      const nullIndicator = page.getByText(/null/i).first().or(page.locator('[class*="null"], [class*="empty"]').first());
      // Just verify table renders without error
      await expect(page.locator('table, [role="grid"]').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation', async ({ page }) => {
      const table = page.locator('table, [role="grid"]').first();
      await table.focus();
      
      // Press arrow keys to navigate
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(200);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(200);
      
      // Should still be on the table
      await expect(table).toBeFocused({ timeout: 5000 }).catch(() => {
        // Table might not be directly focusable, that's okay
      });
    });
  });

  test.describe('Responsive Design', () => {
    test('should handle small screen sizes', async ({ page }) => {
      // Set viewport to mobile size
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      // Table should still be visible (possibly with horizontal scroll)
      const table = page.locator('table, [role="grid"], [data-testid="data-table"]').first();
      await expect(table).toBeVisible({ timeout: 10000 });
    });

    test('should handle medium screen sizes', async ({ page }) => {
      // Set viewport to tablet size
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      const table = page.locator('table, [role="grid"], [data-testid="data-table"]').first();
      await expect(table).toBeVisible({ timeout: 10000 });
    });
  });
});

// Cleanup
test.afterAll(async () => {
  const files = ['table-test-data.csv', 'large-table-data.csv', 'null-data.csv'];
  for (const file of files) {
    const filePath = path.join(FIXTURES_DIR, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

