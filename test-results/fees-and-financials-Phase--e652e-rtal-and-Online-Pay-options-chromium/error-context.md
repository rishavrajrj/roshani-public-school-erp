# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fees-and-financials.spec.ts >> Phase 5 — Fees & Financial Management E2E >> 2. Parent views Fee Portal and Online Pay options
- Location: e2e\fees-and-financials.spec.ts:26:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - heading "Roshani Public School" [level=2] [ref=e4]
      - paragraph [ref=e5]: ERP System
    - generic [ref=e8]:
      - generic [ref=e9]:
        - heading "Welcome back" [level=1] [ref=e10]
        - paragraph [ref=e11]: Please enter your details to sign in
      - generic [ref=e12]:
        - generic [ref=e13]:
          - text: Email
          - textbox "Enter your email" [ref=e15]: parent@roshanischool.com
        - generic [ref=e16]:
          - text: Password
          - generic [ref=e17]:
            - textbox "Enter your password" [ref=e18]: TestPass123!
            - button [ref=e19]
        - link "Forgot password?" [ref=e24] [cursor=pointer]:
          - /url: /forgot-password
        - button "Log in" [ref=e25]
  - alert [ref=e26]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | const PASSWORD = 'TestPass123!'
  4  | 
  5  | test.describe('Phase 5 — Fees & Financial Management E2E', () => {
  6  |   test.setTimeout(60000)
  7  | 
  8  |   test('1. Admin views Fee & Financial Dashboard', async ({ page }) => {
  9  |     await page.goto('/login')
  10 |     await page.fill('input[name="email"]', 'admin@roshanischool.com')
  11 |     await page.fill('input[name="password"]', PASSWORD)
  12 |     await page.click('button[type="submit"]')
  13 | 
  14 |     await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })
  15 | 
  16 |     // Navigate to Admin Fees
  17 |     await page.goto('/erp/admin/fees')
  18 |     await expect(page.locator('h1')).toContainText('Fee & Financial Management', { timeout: 10000 })
  19 | 
  20 |     // Verify summary KPI cards exist
  21 |     await expect(page.getByText('Total Billed')).toBeVisible()
  22 |     await expect(page.getByText('Total Collected')).toBeVisible()
  23 |     await expect(page.getByText('Total Outstanding')).toBeVisible()
  24 |   })
  25 | 
  26 |   test('2. Parent views Fee Portal and Online Pay options', async ({ page }) => {
  27 |     await page.goto('/login')
  28 |     await page.fill('input[name="email"]', 'parent@roshanischool.com')
  29 |     await page.fill('input[name="password"]', PASSWORD)
  30 |     await page.click('button[type="submit"]')
  31 | 
> 32 |     await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })
     |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  33 | 
  34 |     // Navigate to Parent Fees
  35 |     await page.goto('/erp/parent/fees')
  36 |     await expect(page.locator('h1')).toContainText(/Fee Portal/, { timeout: 10000 })
  37 |   })
  38 | 
  39 |   test('3. Student views My Fees Read-Only Portal', async ({ page }) => {
  40 |     await page.goto('/login')
  41 |     await page.fill('input[name="email"]', 'student@roshanischool.com')
  42 |     await page.fill('input[name="password"]', PASSWORD)
  43 |     await page.click('button[type="submit"]')
  44 | 
  45 |     await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })
  46 | 
  47 |     // Navigate to Student Fees
  48 |     await page.goto('/erp/student/fees')
  49 |     await expect(page.locator('h1')).toContainText(/Fee Portal/, { timeout: 10000 })
  50 |   })
  51 | })
  52 | 
```