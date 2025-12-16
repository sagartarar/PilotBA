import { test, expect } from '@playwright/test'

test.describe('PilotBA Application', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check that the title is visible
    await expect(page.getByRole('heading', { name: 'PilotBA' })).toBeVisible()
  })

  test('displays application tagline', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.getByText('Lightning-Fast Business Intelligence')).toBeVisible()
  })

  test('displays welcome message', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.getByRole('heading', { name: 'Welcome to PilotBA' })).toBeVisible()
    await expect(page.getByText(/Building the next generation of BI tools/)).toBeVisible()
  })

  test('has correct page title', async ({ page }) => {
    await page.goto('/')
    
    await expect(page).toHaveTitle(/PilotBA/)
  })
})

test.describe('Navigation', () => {
  test('header is sticky', async ({ page }) => {
    await page.goto('/')
    
    const header = page.locator('header')
    await expect(header).toBeVisible()
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500))
    
    // Header should still be visible (if sticky)
    await expect(header).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('mobile viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    await expect(page.getByRole('heading', { name: 'PilotBA' })).toBeVisible()
  })

  test('tablet viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    
    await expect(page.getByRole('heading', { name: 'PilotBA' })).toBeVisible()
  })

  test('desktop viewport renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    
    await expect(page.getByRole('heading', { name: 'PilotBA' })).toBeVisible()
  })
})

test.describe('Performance', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })
})

test.describe('SEO and Meta Tags', () => {
  test('has proper meta tags', async ({ page }) => {
    await page.goto('/')
    
    // Check viewport meta tag
    const viewportMeta = page.locator('meta[name="viewport"]')
    await expect(viewportMeta).toHaveAttribute('content', /width=device-width/)
  })
})

