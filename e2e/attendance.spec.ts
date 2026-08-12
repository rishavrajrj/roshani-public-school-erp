import { test, expect } from '@playwright/test'

const PASSWORD = 'TestPass123!'

test.describe('Phase 4 Attendance Management E2E', () => {
  test.setTimeout(60000)

  test('1. Admin views Teacher Assignments and Attendance Overview', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })

    if (page.url().includes('select-role')) {
      await page.goto('/erp/admin')
    }

    // Navigate to Teacher Assignments
    await page.goto('/erp/admin/teacher-assignments')
    await expect(page.locator('h1')).toContainText('Teacher Class Assignments', { timeout: 10000 })

    // Navigate to Admin Attendance Overview
    await page.goto('/erp/admin/attendance')
    await expect(page.locator('h1')).toContainText('School Attendance Management', { timeout: 10000 })
    await expect(page.locator('text=Total Sections')).toBeVisible()
  })

  test('2. Teacher Attendance Marking Dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'teacher@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })

    // Navigate to Teacher Attendance Portal
    await page.goto('/erp/teacher/attendance')
    await expect(page.locator('h1')).toContainText('Attendance Portal', { timeout: 10000 })
  })

  test('3. Parent Child Attendance View', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'parent@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })

    // Navigate to Child Attendance
    await page.goto('/erp/parent/attendance')
    await expect(page.locator('h1')).toContainText('Child Attendance', { timeout: 10000 })
  })

  test('4. Student Self Attendance View', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'student@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })

    // Navigate to Student Attendance
    await page.goto('/erp/student/attendance')
    await expect(page.locator('h1')).toContainText('My Attendance Record', { timeout: 10000 })
  })
})
