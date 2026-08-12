# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admissions-and-students.spec.ts >> Phase 3 — Admissions & Student Management E2E >> 2. Direct Administrative Student Enrollment
- Location: e2e\admissions-and-students.spec.ts:61:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/erp\/admin\/students\/[a-f0-9-]+/
Received string:  "http://localhost:3000/erp/admin/students/new"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    33 × locator resolved to <html lang="en" class="geist_a71539c9-module__T19VSG__variable geist_mono_8d43a2aa-module__8Li5zG__variable h-full antialiased">…</html>
       - unexpected value "http://localhost:3000/erp/admin/students/new"

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
    - link "Attendance":
      - /url: /erp/admin/attendance
    - link "Teachers":
      - /url: /erp/admin/teacher-assignments
  - button "Log out"
- main:
  - link "← Back to Student Directory":
    - /url: /erp/admin/students
  - heading "Direct Administrative Enrollment" [level=1]
  - text: Invalid input
  - heading "Student Information" [level=3]
  - text: First Name *
  - textbox "e.g. Arjun": Sanya
  - text: Middle Name
  - textbox "e.g. Kumar"
  - text: Last Name *
  - textbox "e.g. Sharma": Mehta
  - text: Date of Birth
  - textbox: 2017-09-20
  - text: Gender
  - combobox:
    - option "Select Gender"
    - option "Male"
    - option "Female" [selected]
    - option "Other"
  - text: "Custom Admission # (Optional)"
  - textbox "Leave empty for auto-gen"
  - heading "Academic Assignment" [level=3]
  - text: Academic Session *
  - combobox:
    - option "2026-27 (Current)" [selected]
  - text: Class *
  - combobox:
    - option "Nursery" [selected]
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
  - text: Section *
  - combobox:
    - option "Section A" [selected]
    - option "Section B"
  - text: Roll Number
  - textbox "e.g. 05"
  - heading "Primary Guardian Information" [level=3]
  - text: Guardian Name *
  - textbox "e.g. Rajesh Sharma": Vikram Mehta
  - text: Relationship *
  - combobox:
    - option "Father" [selected]
    - option "Mother"
    - option "Guardian"
  - text: Phone Number *
  - textbox "+91 9876543210": "+919876500002"
  - text: Email Address
  - textbox "guardian@example.com"
  - heading "Contact Address" [level=3]
  - text: Street Address
  - textbox "Village / Street details"
  - text: City / District
  - textbox: East Champaran
  - text: State
  - textbox: Bihar
  - button "Cancel"
  - button "Enroll Student"
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
  14  |     await expect(page).toHaveURL(/\/erp\/(admin|select-role)/, { timeout: 15000 })
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
  37  |     await expect(page.locator('h2')).toContainText('Kabir Verma')
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
  67  |     await expect(page).toHaveURL(/\/erp\/(admin|select-role)/, { timeout: 15000 })
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
> 87  |     await expect(page).toHaveURL(/\/erp\/admin\/students\/[a-f0-9-]+/, { timeout: 15000 })
      |                        ^ Error: expect(page).toHaveURL(expected) failed
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
  107 |     // 2. Log out / clear cookies & Log in as Accountant
  108 |     await page.context().clearCookies()
  109 |     await page.goto('/login')
  110 |     await page.fill('input[name="email"]', 'accountant@roshanischool.com')
  111 |     await page.fill('input[name="password"]', PASSWORD)
  112 |     await page.click('button[type="submit"]')
  113 |     await expect(page).toHaveURL(/\/erp\/accountant/)
  114 | 
  115 |     // Attempt accessing New Student Creation
  116 |     await page.goto('/erp/admin/students/new')
  117 |     await expect(page).toHaveURL(/\/erp\/unauthorized/)
  118 |   })
  119 | })
  120 | 
```