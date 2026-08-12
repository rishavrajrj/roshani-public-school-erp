import { test, expect } from '@playwright/test'

const PASSWORD = 'TestPass123!'

test.describe('Phase 3 — Admissions & Student Management E2E', () => {
  test.setTimeout(90000)

  test('1. Full Admission Lifecycle: Create -> Review -> Approve -> Convert to Student', async ({ page }) => {
    // 1. Log in as Admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/erp\/(admin|select-role)/, { timeout: 15000 })

    // 2. Navigate to New Admission Application
    await page.goto('/erp/admin/admissions/new')
    await expect(page.locator('h1')).toContainText('New Admission Application')

    // 3. Fill form
    await page.fill('input[name="applicant_first_name"]', 'Kabir')
    await page.fill('input[name="applicant_last_name"]', 'Verma')
    await page.fill('input[name="date_of_birth"]', '2016-04-15')
    await page.selectOption('select[name="gender"]', 'male')
    await page.selectOption('select[name="applying_for_class_id"]', { index: 1 }) // First available class

    await page.fill('input[name="guardian_name"]', 'Suresh Verma')
    await page.fill('input[name="guardian_phone"]', '+919876500001')
    await page.fill('input[name="guardian_email"]', 'suresh.verma@example.com')
    await page.fill('input[name="address"]', 'Station Road, Turkauliya')

    // Submit application
    await page.click('button[type="submit"]')

    // 4. Verify redirected to Application Detail view
    await expect(page).toHaveURL(/\/erp\/admin\/admissions\/[a-f0-9-]+/, { timeout: 15000 })
    await expect(page.locator('h2')).toContainText('Kabir Verma')
    await expect(page.locator('body')).toContainText('SUBMITTED')

    // 5. Start Review (submitted -> under_review)
    await page.click('button:has-text("Start Review")')
    await expect(page.locator('body')).toContainText('UNDER REVIEW', { timeout: 10000 })

    // 6. Approve Application (under_review -> approved)
    await page.click('button:has-text("Approve Application")')
    await expect(page.locator('body')).toContainText('APPROVED', { timeout: 10000 })

    // 7. Convert to Enrolled Student
    await page.click('button:has-text("Convert to Enrolled Student")')
    await expect(page.locator('h3:has-text("Convert Admission to Student")')).toBeVisible()

    // Submit conversion modal
    await page.click('button:has-text("Confirm Conversion")')

    // 8. Verify redirected to Student Profile
    await expect(page).toHaveURL(/\/erp\/admin\/students\/[a-f0-9-]+/, { timeout: 15000 })
    await expect(page.locator('h2')).toContainText('Kabir Verma')
    await expect(page.locator('body')).toContainText('ACTIVE')
  })

  test('2. Direct Administrative Student Enrollment', async ({ page }) => {
    // 1. Log in as Admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/erp\/(admin|select-role)/, { timeout: 15000 })

    // 2. Navigate to Direct Student Enrollment
    await page.goto('/erp/admin/students/new')
    await expect(page.locator('h1')).toContainText('Direct Administrative Enrollment')

    // 3. Fill direct student form
    await page.fill('input[name="first_name"]', 'Sanya')
    await page.fill('input[name="last_name"]', 'Mehta')
    await page.fill('input[name="date_of_birth"]', '2017-09-20')
    await page.selectOption('select[name="gender"]', 'female')

    await page.fill('input[name="guardian_name"]', 'Vikram Mehta')
    await page.selectOption('select[name="guardian_relationship"]', 'father')
    await page.fill('input[name="guardian_phone"]', '+919876500002')

    // Submit
    await page.click('button[type="submit"]')

    // 4. Verify redirected to Student Profile
    await expect(page).toHaveURL(/\/erp\/admin\/students\/[a-f0-9-]+/, { timeout: 15000 })
    await expect(page.locator('h2')).toContainText('Sanya Mehta')
  })

  test('3. Security Negative Authorization Checks', async ({ page }) => {
    // 1. Log in as Teacher
    await page.goto('/login')
    await page.fill('input[name="email"]', 'teacher@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/erp\/teacher/)

    // Attempt accessing Admin Admissions
    await page.goto('/erp/admin/admissions')
    await expect(page).toHaveURL(/\/erp\/unauthorized/)

    // Attempt accessing Admin Students
    await page.goto('/erp/admin/students')
    await expect(page).toHaveURL(/\/erp\/unauthorized/)

    // 2. Log out / clear cookies & Log in as Accountant
    await page.context().clearCookies()
    await page.goto('/login')
    await page.fill('input[name="email"]', 'accountant@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/erp\/accountant/)

    // Attempt accessing New Student Creation
    await page.goto('/erp/admin/students/new')
    await expect(page).toHaveURL(/\/erp\/unauthorized/)
  })
})
