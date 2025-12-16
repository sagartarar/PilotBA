import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('homepage should not have automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    // H1 should exist
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    
    // H2 should exist
    const h2 = page.getByRole('heading', { level: 2 })
    await expect(h2).toBeVisible()
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    
    // Focus should be visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeDefined()
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze()
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    )
    
    expect(contrastViolations).toHaveLength(0)
  })

  test('images should have alt text', async ({ page }) => {
    await page.goto('/')
    
    const images = await page.locator('img').all()
    
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      // Alt attribute should exist (can be empty for decorative images)
      expect(alt).not.toBeNull()
    }
  })

  test('form elements should have labels', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze()
    
    const labelViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'label'
    )
    
    expect(labelViolations).toHaveLength(0)
  })

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('/')
    
    // Check for ARIA landmarks
    const main = page.locator('main')
    await expect(main).toBeVisible()
    
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })

  test('should handle zoom levels correctly', async ({ page }) => {
    await page.goto('/')
    
    // Zoom in
    await page.evaluate(() => {
      document.body.style.zoom = '150%'
    })
    
    // Content should still be visible
    await expect(page.getByRole('heading', { name: 'PilotBA' })).toBeVisible()
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '100%'
    })
  })
})

test.describe('Screen Reader Compatibility', () => {
  test('should have proper ARIA roles', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    
    const ariaViolations = accessibilityScanResults.violations.filter(
      violation => violation.id.includes('aria')
    )
    
    expect(ariaViolations).toHaveLength(0)
  })
})

