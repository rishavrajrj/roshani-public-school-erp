import { test, expect } from '@playwright/test'

const PASSWORD = 'TestPass123!'

test.describe('Phase 5 — Fees & Financial Management E2E', () => {
  test.setTimeout(60000)

  test('1. Admin views Fee & Financial Dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })

    // Navigate to Admin Fees
    await page.goto('/erp/admin/fees')
    await expect(page.locator('h1')).toContainText('Fee & Financial Management', { timeout: 10000 })

    // Verify summary KPI cards exist
    await expect(page.getByText('Total Billed')).toBeVisible()
    await expect(page.getByText('Total Collected')).toBeVisible()
    await expect(page.getByText('Total Outstanding')).toBeVisible()
  })

  test('2. Parent views Fee Portal and Online Pay options', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'parent@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })

    // Navigate to Parent Fees
    await page.goto('/erp/parent/fees')
    await expect(page.locator('h1')).toContainText(/Fee Portal/, { timeout: 10000 })
  })

  test('3. Student views My Fees Read-Only Portal', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'student@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })

    // Navigate to Student Fees
    await page.goto('/erp/student/fees')
    await expect(page.locator('h1')).toContainText(/Fee Portal/, { timeout: 10000 })
  })
})
