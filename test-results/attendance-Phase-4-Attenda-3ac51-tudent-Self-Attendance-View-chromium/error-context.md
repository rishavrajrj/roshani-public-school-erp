# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: attendance.spec.ts >> Phase 4 Attendance Management E2E >> 4. Student Self Attendance View
- Location: e2e\attendance.spec.ts:56:7

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
        - generic [ref=e13]: Invalid email or password
        - generic [ref=e14]:
          - text: Email
          - textbox "Enter your email" [ref=e16]: student@roshanischool.com
        - generic [ref=e17]:
          - text: Password
          - generic [ref=e18]:
            - textbox "Enter your password" [ref=e19]: TestPass123!
            - button [ref=e20]
        - link "Forgot password?" [ref=e25] [cursor=pointer]:
          - /url: /forgot-password
        - button "Log in" [ref=e26]
  - alert [ref=e27]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | const PASSWORD = 'TestPass123!'
  4  | 
  5  | test.describe('Phase 4 Attendance Management E2E', () => {
  6  |   test.setTimeout(60000)
  7  | 
  8  |   test('1. Admin views Teacher Assignments and Attendance Overview', async ({ page }) => {
  9  |     await page.goto('/login')
  10 |     await page.fill('input[name="email"]', 'admin@roshanischool.com')
  11 |     await page.fill('input[name="password"]', PASSWORD)
  12 |     await page.click('button[type="submit"]')
  13 | 
  14 |     await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })
  15 | 
  16 |     if (page.url().includes('select-role')) {
  17 |       await page.goto('/erp/admin')
  18 |     }
  19 | 
  20 |     // Navigate to Teacher Assignments
  21 |     await page.goto('/erp/admin/teacher-assignments')
  22 |     await expect(page.locator('h1')).toContainText('Teacher Class Assignments', { timeout: 10000 })
  23 | 
  24 |     // Navigate to Admin Attendance Overview
  25 |     await page.goto('/erp/admin/attendance')
  26 |     await expect(page.locator('h1')).toContainText('School Attendance Management', { timeout: 10000 })
  27 |     await expect(page.locator('text=Total Sections')).toBeVisible()
  28 |   })
  29 | 
  30 |   test('2. Teacher Attendance Marking Dashboard', async ({ page }) => {
  31 |     await page.goto('/login')
  32 |     await page.fill('input[name="email"]', 'teacher@roshanischool.com')
  33 |     await page.fill('input[name="password"]', PASSWORD)
  34 |     await page.click('button[type="submit"]')
  35 | 
  36 |     await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })
  37 | 
  38 |     // Navigate to Teacher Attendance Portal
  39 |     await page.goto('/erp/teacher/attendance')
  40 |     await expect(page.locator('h1')).toContainText('Attendance Portal', { timeout: 10000 })
  41 |   })
  42 | 
  43 |   test('3. Parent Child Attendance View', async ({ page }) => {
  44 |     await page.goto('/login')
  45 |     await page.fill('input[name="email"]', 'parent@roshanischool.com')
  46 |     await page.fill('input[name="password"]', PASSWORD)
  47 |     await page.click('button[type="submit"]')
  48 | 
  49 |     await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })
  50 | 
  51 |     // Navigate to Child Attendance
  52 |     await page.goto('/erp/parent/attendance')
  53 |     await expect(page.locator('h1')).toContainText('Child Attendance', { timeout: 10000 })
  54 |   })
  55 | 
  56 |   test('4. Student Self Attendance View', async ({ page }) => {
  57 |     await page.goto('/login')
  58 |     await page.fill('input[name="email"]', 'student@roshanischool.com')
  59 |     await page.fill('input[name="password"]', PASSWORD)
  60 |     await page.click('button[type="submit"]')
  61 | 
> 62 |     await page.waitForURL((url) => url.pathname.startsWith('/erp'), { timeout: 15000 })
     |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  63 | 
  64 |     // Navigate to Student Attendance
  65 |     await page.goto('/erp/student/attendance')
  66 |     await expect(page.locator('h1')).toContainText('My Attendance Record', { timeout: 10000 })
  67 |   })
  68 | })
  69 | 
```