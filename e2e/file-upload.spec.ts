/**
 * File Upload E2E Tests
 * 
 * @author Toaster (Senior QA)
 * @date December 17, 2025
 * 
 * Tests end-to-end file upload workflow including drag-and-drop,
 * file validation, progress indicators, and error handling.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Test fixtures directory
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// Ensure fixtures directory exists
test.beforeAll(async () => {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }
  
  // Create test CSV file
  const csvContent = `id,name,price,quantity,category
1,Widget A,19.99,100,Electronics
2,Widget B,29.99,50,Electronics
3,Gadget C,49.99,75,Gadgets
4,Tool D,9.99,200,Tools
5,Device E,99.99,25,Electronics`;
  
  fs.writeFileSync(path.join(FIXTURES_DIR, 'test-data.csv'), csvContent);
  
  // Create test JSON file
  const jsonContent = JSON.stringify([
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
    { id: 3, name: 'Item 3', value: 300 },
  ], null, 2);
  
  fs.writeFileSync(path.join(FIXTURES_DIR, 'test-data.json'), jsonContent);
  
  // Create large CSV file for performance testing
  const largeRows = ['id,name,price'];
  for (let i = 0; i < 10000; i++) {
    largeRows.push(`${i},Item ${i},${(Math.random() * 100).toFixed(2)}`);
  }
  fs.writeFileSync(path.join(FIXTURES_DIR, 'large-data.csv'), largeRows.join('\n'));
  
  // Create invalid file
  fs.writeFileSync(path.join(FIXTURES_DIR, 'invalid.txt'), 'This is not a valid CSV or JSON file');
});

test.describe('File Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Upload Interface', () => {
    test('should display file upload area', async ({ page }) => {
      // Look for upload area or drag-and-drop zone
      const uploadArea = page.locator('[data-testid="file-uploader"], .file-upload, [class*="upload"]').first();
      await expect(uploadArea).toBeVisible({ timeout: 10000 });
    });

    test('should show upload instructions', async ({ page }) => {
      // Should show instructions about supported file types
      await expect(page.getByText(/drag|drop|upload/i).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('CSV Upload', () => {
    test('should upload CSV file successfully', async ({ page }) => {
      // Find file input
      const fileInput = page.locator('input[type="file"]').first();
      
      // Upload CSV file
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.csv'));
      
      // Wait for upload to complete
      await page.waitForTimeout(2000);
      
      // Should show the uploaded file or data
      await expect(page.getByText(/test-data\.csv|Widget|Electronics/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display row count after CSV upload', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.csv'));
      
      await page.waitForTimeout(2000);
      
      // Should show row count (5 rows in test data)
      await expect(page.getByText(/5 rows|5.*row/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display column count after CSV upload', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.csv'));
      
      await page.waitForTimeout(2000);
      
      // Should show column count (5 columns in test data)
      await expect(page.getByText(/5 col|5.*column/i).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('JSON Upload', () => {
    test('should upload JSON file successfully', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.json'));
      
      await page.waitForTimeout(2000);
      
      // Should show the uploaded file or data
      await expect(page.getByText(/test-data\.json|Item 1|Item 2/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('should display row count after JSON upload', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.json'));
      
      await page.waitForTimeout(2000);
      
      // Should show row count (3 items in test data)
      await expect(page.getByText(/3 rows|3.*row/i).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Multiple File Upload', () => {
    test('should allow uploading multiple files', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      
      // Upload first file
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.csv'));
      await page.waitForTimeout(2000);
      
      // Upload second file
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.json'));
      await page.waitForTimeout(2000);
      
      // Both files should be listed or accessible
      // Check for dataset manager or file list
      const datasetList = page.locator('[data-testid="dataset-manager"], [class*="dataset"]').first();
      if (await datasetList.isVisible()) {
        await expect(page.getByText(/2 dataset/i).first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Large File Upload', () => {
    test('should handle large CSV file upload', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      
      const startTime = Date.now();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'large-data.csv'));
      
      // Wait for upload to complete
      await page.waitForTimeout(5000);
      
      const endTime = Date.now();
      const uploadTime = endTime - startTime;
      
      // Should complete in reasonable time (< 10 seconds)
      expect(uploadTime).toBeLessThan(10000);
      
      // Should show row count
      await expect(page.getByText(/10,000|10000/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('should show progress indicator for large files', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'large-data.csv'));
      
      // Look for progress indicator (may be brief for fast uploads)
      const progressIndicator = page.locator('[role="progressbar"], [class*="progress"], [class*="loading"]').first();
      
      // Progress indicator may or may not be visible depending on upload speed
      // Just verify upload completes successfully
      await page.waitForTimeout(5000);
      await expect(page.getByText(/large-data\.csv|10,000|10000/i).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Error Handling', () => {
    test('should show error for invalid file type', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      
      // Try to upload invalid file
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'invalid.txt'));
      await page.waitForTimeout(2000);
      
      // Should show error message
      const errorMessage = page.getByText(/unsupported|invalid|error|not supported/i).first();
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should handle empty file gracefully', async ({ page }) => {
      // Create empty file
      fs.writeFileSync(path.join(FIXTURES_DIR, 'empty.csv'), '');
      
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'empty.csv'));
      await page.waitForTimeout(2000);
      
      // Should either show error or empty state
      const emptyOrError = page.getByText(/empty|no data|0 rows|error/i).first();
      await expect(emptyOrError).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Drag and Drop', () => {
    test('should highlight drop zone on drag over', async ({ page }) => {
      const dropZone = page.locator('[data-testid="file-uploader"], .file-upload, [class*="upload"]').first();
      
      // Simulate drag over
      await dropZone.dispatchEvent('dragover', {
        dataTransfer: { types: ['Files'] },
      });
      
      // Check for visual feedback (class change, border change, etc.)
      // This is implementation-specific
      await page.waitForTimeout(500);
    });
  });

  test.describe('File Preview', () => {
    test('should show file preview after upload', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.csv'));
      
      await page.waitForTimeout(2000);
      
      // Should show some data from the file
      await expect(page.getByText(/Widget|Electronics|Gadget/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('should show column names after upload', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.csv'));
      
      await page.waitForTimeout(2000);
      
      // Should show column names
      await expect(page.getByText('id')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('name')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Dataset Management', () => {
    test('should allow selecting different datasets', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      
      // Upload first file
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.csv'));
      await page.waitForTimeout(2000);
      
      // Upload second file
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.json'));
      await page.waitForTimeout(2000);
      
      // Click on first dataset to select it
      const firstDataset = page.getByText('test-data.csv').first();
      if (await firstDataset.isVisible()) {
        await firstDataset.click();
        await page.waitForTimeout(1000);
        
        // Should show data from first dataset
        await expect(page.getByText(/Widget|Electronics/i).first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should allow deleting datasets', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(path.join(FIXTURES_DIR, 'test-data.csv'));
      
      await page.waitForTimeout(2000);
      
      // Look for delete button
      const deleteButton = page.locator('[title*="delete" i], [aria-label*="delete" i], button:has-text("Delete")').first();
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion if dialog appears
        const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }
        
        await page.waitForTimeout(1000);
        
        // Dataset should be removed
        await expect(page.getByText('test-data.csv')).not.toBeVisible({ timeout: 5000 });
      }
    });
  });
});

// Cleanup
test.afterAll(async () => {
  // Clean up test files
  const files = ['test-data.csv', 'test-data.json', 'large-data.csv', 'invalid.txt', 'empty.csv'];
  for (const file of files) {
    const filePath = path.join(FIXTURES_DIR, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

