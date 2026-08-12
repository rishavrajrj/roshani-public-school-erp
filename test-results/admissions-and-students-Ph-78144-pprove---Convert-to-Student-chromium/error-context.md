# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admissions-and-students.spec.ts >> Phase 3 — Admissions & Student Management E2E >> 1. Full Admission Lifecycle: Create -> Review -> Approve -> Convert to Student
- Location: e2e\admissions-and-students.spec.ts:8:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/erp\/(admin|select-role)/
Received string:  "http://localhost:3000/login"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    33 × locator resolved to <html lang="en" class="geist_a71539c9-module__T19VSG__variable geist_mono_8d43a2aa-module__8Li5zG__variable h-full antialiased">…</html>
       - unexpected value "http://localhost:3000/login"

```

```yaml
- heading "Roshani Public School" [level=2]
- paragraph: ERP System
- heading "Welcome back" [level=1]
- paragraph: Please enter your details to sign in
- text: Email
- textbox "Enter your email": admin@roshanischool.com
- text: Password
- textbox "Enter your password": TestPass123!
- button:
  - img
- link "Forgot password?":
  - /url: /forgot-password
- button "Log in"
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | const PASSWORD = 'TestPass123!'
  4   | 
  5   | test.describe('Phase 3 — Admissions & Student Management E2E', () => {
  6   |   test.setTimeout(90000)
  7   | 
  8   |   test('1. Full Admission Lifecycle: Create -> Review -> Approve -> Convert to Student', async ({ page }) => {
  9   |     // 1. Log in as Admin
  10  |     await page.goto('/login')
  11  |     await page.fill('input[name="email"]', 'admin@roshanischool.com')
  12  |     await page.fill('input[name="password"]', PASSWORD)
  13  |     await page.click('button[type="submit"]')
> 14  |     await expect(page).toHaveURL(/\/erp\/(admin|select-role)/, { timeout: 15000 })
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  15  | 
  16  |     // 2. Navigate to New Admission Application
  17  |     await page.goto('/erp/admin/admissions/new')
  18  |     await expect(page.locator('h1')).toContainText('New Admission Application')
  19  | 
  20  |     // 3. Fill form
  21  |     await page.fill('input[name="applicant_first_name"]', 'Kabir')
  22  |     await page.fill('input[name="applicant_last_name"]', 'Verma')
  23  |     await page.fill('input[name="date_of_birth"]', '2016-04-15')
  24  |     await page.selectOption('select[name="gender"]', 'male')
  25  |     await page.waitForFunction(() => {
  26  |       const sessSelect = document.querySelector('select[name="academic_session_id"]') as HTMLSelectElement
  27  |       const classSelect = document.querySelector('select[name="applying_for_class_id"]') as HTMLSelectElement
  28  |       return sessSelect && sessSelect.options.length > 1 && classSelect && classSelect.options.length > 1
  29  |     })
  30  |     const sessVal = await page.$eval('select[name="academic_session_id"] option:not([value=""])', (el: any) => el.value)
  31  |     await page.selectOption('select[name="academic_session_id"]', sessVal)
  32  | 
  33  |     const classVal = await page.$eval('select[name="applying_for_class_id"] option:not([value=""])', (el: any) => el.value)
  34  |     await page.selectOption('select[name="applying_for_class_id"]', classVal)
  35  | 
  36  |     await page.fill('input[name="guardian_name"]', 'Suresh Verma')
  37  |     await page.fill('input[name="guardian_phone"]', '+919876500001')
  38  |     await page.fill('input[name="guardian_email"]', 'suresh.verma@example.com')
  39  |     await page.fill('input[name="address"]', 'Station Road, Turkauliya')
  40  | 
  41  |     // Submit application
  42  |     await page.click('button[type="submit"]')
  43  | 
  44  |     // 4. Verify redirected to Application Detail view
  45  |     await expect(page).toHaveURL(/\/erp\/admin\/admissions\/[a-f0-9-]+/, { timeout: 15000 })
  46  |     await expect(page.locator('h2')).toContainText('Kabir Verma')
  47  |     await expect(page.locator('body')).toContainText('SUBMITTED')
  48  | 
  49  |     // 5. Start Review (submitted -> under_review)
  50  |     await page.click('button:has-text("Start Review")')
  51  |     await expect(page.locator('body')).toContainText('UNDER REVIEW', { timeout: 10000 })
  52  | 
  53  |     // 6. Approve Application (under_review -> approved)
  54  |     await page.click('button:has-text("Approve Application")')
  55  |     await expect(page.locator('body')).toContainText('APPROVED', { timeout: 10000 })
  56  | 
  57  |     // 7. Convert to Enrolled Student
  58  |     await page.click('button:has-text("Convert to Enrolled Student")')
  59  |     await expect(page.locator('h3:has-text("Convert Admission to Student")')).toBeVisible()
  60  | 
  61  |     // Submit conversion modal
  62  |     await page.click('button:has-text("Confirm Conversion")')
  63  | 
  64  |     // 8. Verify redirected to Student Profile
  65  |     await expect(page).toHaveURL(/\/erp\/admin\/students\/[a-f0-9-]+/, { timeout: 15000 })
  66  |     await expect(page.locator('h2')).toContainText('Kabir Verma')
  67  |     await expect(page.locator('body')).toContainText('ACTIVE')
  68  |   })
  69  | 
  70  |   test('2. Direct Administrative Student Enrollment', async ({ page }) => {
  71  |     // 1. Log in as Admin
  72  |     await page.goto('/login')
  73  |     await page.fill('input[name="email"]', 'admin@roshanischool.com')
  74  |     await page.fill('input[name="password"]', PASSWORD)
  75  |     await page.click('button[type="submit"]')
  76  |     await expect(page).toHaveURL(/\/erp\/(admin|select-role)/, { timeout: 15000 })
  77  | 
  78  |     // 2. Navigate to Direct Student Enrollment
  79  |     await page.goto('/erp/admin/students/new')
  80  |     await expect(page.locator('h1')).toContainText('Direct Administrative Enrollment')
  81  | 
  82  |     // 3. Fill direct student form
  83  |     await page.fill('input[name="first_name"]', 'Sanya')
  84  |     await page.fill('input[name="last_name"]', 'Mehta')
  85  |     await page.fill('input[name="date_of_birth"]', '2017-09-20')
  86  |     await page.selectOption('select[name="gender"]', 'female')
  87  | 
  88  |     await page.fill('input[name="guardian_name"]', 'Vikram Mehta')
  89  |     await page.selectOption('select[name="guardian_relationship"]', 'father')
  90  |     await page.fill('input[name="guardian_phone"]', '+919876500002')
  91  | 
  92  |     // Submit
  93  |     await page.click('button[type="submit"]')
  94  | 
  95  |     // 4. Verify redirected to Student Profile
  96  |     await expect(page).toHaveURL(/\/erp\/admin\/students\/[a-f0-9-]+/, { timeout: 15000 })
  97  |     await expect(page.locator('h2')).toContainText('Sanya Mehta')
  98  |   })
  99  | 
  100 |   test('3. Security Negative Authorization Checks', async ({ page }) => {
  101 |     // 1. Log in as Teacher
  102 |     await page.goto('/login')
  103 |     await page.fill('input[name="email"]', 'teacher@roshanischool.com')
  104 |     await page.fill('input[name="password"]', PASSWORD)
  105 |     await page.click('button[type="submit"]')
  106 |     await expect(page).toHaveURL(/\/erp\/teacher/)
  107 | 
  108 |     // Attempt accessing Admin Admissions
  109 |     await page.goto('/erp/admin/admissions')
  110 |     await expect(page).toHaveURL(/\/erp\/unauthorized/)
  111 | 
  112 |     // Attempt accessing Admin Students
  113 |     await page.goto('/erp/admin/students')
  114 |     await expect(page).toHaveURL(/\/erp\/unauthorized/)
```