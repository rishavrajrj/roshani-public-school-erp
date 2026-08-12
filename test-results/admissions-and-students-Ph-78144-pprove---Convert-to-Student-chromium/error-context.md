# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admissions-and-students.spec.ts >> Phase 3 — Admissions & Student Management E2E >> 1. Full Admission Lifecycle: Create -> Review -> Approve -> Convert to Student
- Location: e2e\admissions-and-students.spec.ts:8:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h2')
Expected substring: "Kabir Verma"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h2')

```

```yaml
- banner:
  - link "Roshani Public School ERP":
    - /url: /erp/admin
  - text: Priya Sharma (Admin) (Admin)
  - navigation:
    - link "Dashboard":
      - /url: /erp/admin
    - link "Admissions":
      - /url: /erp/admin/admissions
    - link "Students":
      - /url: /erp/admin/students
  - button "Log out"
- main:
  - heading "Admission Applications" [level=1]
  - paragraph: Manage student enquiries, application review workflow, and student conversion.
  - link "+ New Application":
    - /url: /erp/admin/admissions/new
  - text: Search
  - 'textbox "App #, Name, Phone..."'
  - text: Status
  - combobox:
    - option "All Statuses" [selected]
    - option "Draft"
    - option "Submitted"
    - option "Under Review"
    - option "Approved"
    - option "Rejected"
    - option "Withdrawn"
    - option "Converted to Student"
  - text: Academic Session
  - combobox:
    - option "All Sessions" [selected]
    - option "2026-27 (Current)"
  - text: Applying Class
  - combobox:
    - option "All Classes" [selected]
    - option "Nursery"
    - option "LKG"
    - option "UKG"
    - option "Class 1"
    - option "Class 2"
    - option "Class 3"
    - option "Class 4"
    - option "Class 5"
    - option "Class 6"
    - option "Class 7"
    - option "Class 8"
    - option "Class 9"
    - option "Class 10"
    - option "Class 11"
    - option "Class 12"
  - button "Apply Filter"
  - link "Clear":
    - /url: /erp/admin/admissions
  - table:
    - rowgroup:
      - 'row "Application # Applicant Name Class Guardian Details Session Status Submitted Date Actions"':
        - 'columnheader "Application #"'
        - columnheader "Applicant Name"
        - columnheader "Class"
        - columnheader "Guardian Details"
        - columnheader "Session"
        - columnheader "Status"
        - columnheader "Submitted Date"
        - columnheader "Actions"
    - rowgroup:
      - row "No admission applications found matching the selected criteria.":
        - cell "No admission applications found matching the selected criteria."
- alert: Admission Applications
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
  14  |     await expect(page).toHaveURL(/\/erp\/admin/, { timeout: 10000 })
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
  25  |     await page.selectOption('select[name="applying_for_class_id"]', { index: 1 }) // First available class
  26  | 
  27  |     await page.fill('input[name="guardian_name"]', 'Suresh Verma')
  28  |     await page.fill('input[name="guardian_phone"]', '+919876500001')
  29  |     await page.fill('input[name="guardian_email"]', 'suresh.verma@example.com')
  30  |     await page.fill('input[name="address"]', 'Station Road, Turkauliya')
  31  | 
  32  |     // Submit application
  33  |     await page.click('button[type="submit"]')
  34  | 
  35  |     // 4. Verify redirected to Application Detail view
  36  |     await expect(page).toHaveURL(/\/erp\/admin\/admissions\/[a-f0-9-]+/, { timeout: 15000 })
> 37  |     await expect(page.locator('h2')).toContainText('Kabir Verma')
      |                                      ^ Error: expect(locator).toContainText(expected) failed
  38  |     await expect(page.locator('body')).toContainText('SUBMITTED')
  39  | 
  40  |     // 5. Start Review (submitted -> under_review)
  41  |     await page.click('button:has-text("Start Review")')
  42  |     await expect(page.locator('body')).toContainText('UNDER REVIEW', { timeout: 10000 })
  43  | 
  44  |     // 6. Approve Application (under_review -> approved)
  45  |     await page.click('button:has-text("Approve Application")')
  46  |     await expect(page.locator('body')).toContainText('APPROVED', { timeout: 10000 })
  47  | 
  48  |     // 7. Convert to Enrolled Student
  49  |     await page.click('button:has-text("Convert to Enrolled Student")')
  50  |     await expect(page.locator('h3:has-text("Convert Admission to Student")')).toBeVisible()
  51  | 
  52  |     // Submit conversion modal
  53  |     await page.click('button:has-text("Confirm Conversion")')
  54  | 
  55  |     // 8. Verify redirected to Student Profile
  56  |     await expect(page).toHaveURL(/\/erp\/admin\/students\/[a-f0-9-]+/, { timeout: 15000 })
  57  |     await expect(page.locator('h2')).toContainText('Kabir Verma')
  58  |     await expect(page.locator('body')).toContainText('ACTIVE')
  59  |   })
  60  | 
  61  |   test('2. Direct Administrative Student Enrollment', async ({ page }) => {
  62  |     // 1. Log in as Admin
  63  |     await page.goto('/login')
  64  |     await page.fill('input[name="email"]', 'admin@roshanischool.com')
  65  |     await page.fill('input[name="password"]', PASSWORD)
  66  |     await page.click('button[type="submit"]')
  67  |     await expect(page).toHaveURL(/\/erp\/admin/)
  68  | 
  69  |     // 2. Navigate to Direct Student Enrollment
  70  |     await page.goto('/erp/admin/students/new')
  71  |     await expect(page.locator('h1')).toContainText('Direct Administrative Enrollment')
  72  | 
  73  |     // 3. Fill direct student form
  74  |     await page.fill('input[name="first_name"]', 'Sanya')
  75  |     await page.fill('input[name="last_name"]', 'Mehta')
  76  |     await page.fill('input[name="date_of_birth"]', '2017-09-20')
  77  |     await page.selectOption('select[name="gender"]', 'female')
  78  | 
  79  |     await page.fill('input[name="guardian_name"]', 'Vikram Mehta')
  80  |     await page.selectOption('select[name="guardian_relationship"]', 'father')
  81  |     await page.fill('input[name="guardian_phone"]', '+919876500002')
  82  | 
  83  |     // Submit
  84  |     await page.click('button[type="submit"]')
  85  | 
  86  |     // 4. Verify redirected to Student Profile
  87  |     await expect(page).toHaveURL(/\/erp\/admin\/students\/[a-f0-9-]+/, { timeout: 15000 })
  88  |     await expect(page.locator('h2')).toContainText('Sanya Mehta')
  89  |   })
  90  | 
  91  |   test('3. Security Negative Authorization Checks', async ({ page }) => {
  92  |     // 1. Log in as Teacher
  93  |     await page.goto('/login')
  94  |     await page.fill('input[name="email"]', 'teacher@roshanischool.com')
  95  |     await page.fill('input[name="password"]', PASSWORD)
  96  |     await page.click('button[type="submit"]')
  97  |     await expect(page).toHaveURL(/\/erp\/teacher/)
  98  | 
  99  |     // Attempt accessing Admin Admissions
  100 |     await page.goto('/erp/admin/admissions')
  101 |     await expect(page).toHaveURL(/\/erp\/unauthorized/)
  102 | 
  103 |     // Attempt accessing Admin Students
  104 |     await page.goto('/erp/admin/students')
  105 |     await expect(page).toHaveURL(/\/erp\/unauthorized/)
  106 | 
  107 |     // 2. Log in as Accountant
  108 |     await page.goto('/login')
  109 |     await page.fill('input[name="email"]', 'accountant@roshanischool.com')
  110 |     await page.fill('input[name="password"]', PASSWORD)
  111 |     await page.click('button[type="submit"]')
  112 |     await expect(page).toHaveURL(/\/erp\/accountant/)
  113 | 
  114 |     // Attempt accessing New Student Creation
  115 |     await page.goto('/erp/admin/students/new')
  116 |     await expect(page).toHaveURL(/\/erp\/unauthorized/)
  117 |   })
  118 | })
  119 | 
```