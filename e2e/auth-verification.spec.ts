import { test, expect } from '@playwright/test'

const PASSWORD = 'TestPass123!'

test.describe('Phase 2 Auth & Portal Access Verification', () => {
  test.setTimeout(60000)

  test('2. Unauthenticated Access Redirects to /login', async ({ page }) => {
    const protectedRoutes = [
      '/erp/admin',
      '/erp/principal',
      '/erp/teacher',
      '/erp/accountant',
      '/erp/parent',
      '/erp/student',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    }
  })

  test('3. Admin Authorization', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/erp\/admin/, { timeout: 10000 })
    await expect(page.locator('h2')).toContainText('Admin Portal')

    const otherPortals = ['/erp/principal', '/erp/teacher', '/erp/accountant', '/erp/parent', '/erp/student']
    for (const portal of otherPortals) {
      await page.goto(portal)
      await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
    }
  })

  test('4. Principal Authorization', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'principal@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/erp\/principal/, { timeout: 10000 })
    await expect(page.locator('h2')).toContainText('Principal Portal')

    await page.goto('/erp/admin')
    await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  })

  test('5. Teacher Authorization', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'teacher@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/erp\/teacher/, { timeout: 10000 })

    await page.goto('/erp/admin')
    await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })

    await page.goto('/erp/principal')
    await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  })

  test('6. Accountant Authorization', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'accountant@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/erp\/accountant/, { timeout: 10000 })

    await page.goto('/erp/admin')
    await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  })

  test('7. Parent Authorization', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'parent@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/erp\/parent/, { timeout: 10000 })

    await page.goto('/erp/admin')
    await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })

    await page.goto('/erp/teacher')
    await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  })

  test('8. Student Authorization', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'student@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/erp\/student/, { timeout: 10000 })

    await page.goto('/erp/admin')
    await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })

    await page.goto('/erp/teacher')
    await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  })

  test('9. Super Admin Authorization', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'superadmin@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/erp\/admin/, { timeout: 10000 })
    await expect(page.locator('h2')).toContainText('Admin Portal')
  })

  test('10. Unprovisioned User', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'unprovisioned@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/erp\/account-not-provisioned/, { timeout: 10000 })

    await page.goto('/erp/admin')
    await expect(page).toHaveURL(/\/erp\/account-not-provisioned/, { timeout: 5000 })
  })

  test('11. Disabled User', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'disabled@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 10000 })

    await page.goto('/erp/admin')
    await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  })

  test('12. Logout Flow & Invalidation', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/erp\/admin/, { timeout: 10000 })

    await page.click('button:has-text("Log out"), button:has-text("Sign Out"), button:has-text("Logout")')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })

    await page.goto('/erp/admin')
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })

    await page.reload()
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test('13. Session Persistence', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'teacher@roshanischool.com')
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/erp\/teacher/, { timeout: 10000 })

    await page.reload()
    await expect(page).toHaveURL(/\/erp\/teacher/, { timeout: 5000 })
    await expect(page.locator('h2')).toContainText('Teacher Portal')
  })
})
