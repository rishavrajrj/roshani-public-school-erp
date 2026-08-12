import { test, expect } from '@playwright/test'

const PASSWORD = 'TestPass123!'

test.describe('Phase 4 — Leave & Notifications E2E', () => {
  test.setTimeout(60000)

  test('1. Student views Leave Portal and Notification Bell', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'student@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })

    // Navigate to Student Leave
    await page.goto('/erp/student/leave')
    await expect(page.locator('h1')).toContainText('My Leave Applications', { timeout: 10000 })

    // Verify Notification Bell button present
    await expect(page.locator('button[aria-label="Notifications"]')).toBeVisible()
  })

  test('2. Parent views Leave Portal for linked child', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'parent@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })

    // Navigate to Parent Leave
    await page.goto('/erp/parent/leave')
    await expect(page.locator('h1')).toContainText(/Leave/, { timeout: 10000 })
  })

  test('3. Teacher views Leave Portal and Approvals Queue', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'teacher@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })

    // Navigate to Teacher Leave
    await page.goto('/erp/teacher/leave')
    await expect(page.locator('h1')).toContainText('My Leave Applications', { timeout: 10000 })

    // Navigate to Approvals Queue
    await page.goto('/erp/teacher/leave/approvals')
    await expect(page.locator('h1')).toContainText('Leave Approval Queue', { timeout: 10000 })
  })

  test('4. Admin / Principal views Leave Management and Approvals', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })

    // Navigate to Admin Leave
    await page.goto('/erp/admin/leave')
    await expect(page.locator('h1')).toContainText('My Leave Applications', { timeout: 10000 })

    // Navigate to Admin Approvals
    await page.goto('/erp/admin/leave/approvals')
    await expect(page.locator('h1')).toContainText('Leave Approval Queue', { timeout: 10000 })
  })
})
