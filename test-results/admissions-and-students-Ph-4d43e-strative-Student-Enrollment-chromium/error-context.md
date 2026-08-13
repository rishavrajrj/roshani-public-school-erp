# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admissions-and-students.spec.ts >> Phase 3 — Admissions & Student Management E2E >> 2. Direct Administrative Student Enrollment
- Location: e2e\admissions-and-students.spec.ts:76:7

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
    - link "Leave":
      - /url: /erp/admin/leave
    - link "Fees":
      - /url: /erp/admin/fees
    - link "Teachers":
      - /url: /erp/admin/teacher-assignments
  - button "Notifications":
    - img
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
  25  | 
  26  |     await page.waitForFunction(() => {
  27  |       const sessSelect = document.querySelector('select[name="academic_session_id"]') as HTMLSelectElement
  28  |       const classSelect = document.querySelector('select[name="applying_for_class_id"]') as HTMLSelectElement
  29  |       return sessSelect && sessSelect.options.length > 0 && classSelect && classSelect.options.length > 0
  30  |     })
  31  | 
  32  |     const sessVal = await page.$eval('select[name="academic_session_id"] option:not([value=""])', (el: any) => el.value).catch(() => '')
  33  |     if (sessVal) {
  34  |       await page.selectOption('select[name="academic_session_id"]', sessVal)
  35  |     }
  36  | 
  37  |     const classVal = await page.$eval('select[name="applying_for_class_id"] option:not([value=""])', (el: any) => el.value).catch(() => '')
  38  |     if (classVal) {
  39  |       await page.selectOption('select[name="applying_for_class_id"]', classVal)
  40  |     }
  41  | 
  42  |     await page.fill('input[name="guardian_name"]', 'Suresh Verma')
  43  |     await page.fill('input[name="guardian_phone"]', '+919876500001')
  44  |     await page.fill('input[name="guardian_email"]', 'suresh.verma@example.com')
  45  |     await page.fill('input[name="address"]', 'Station Road, Turkauliya')
  46  | 
  47  |     // Submit application
  48  |     await page.click('button[type="submit"]')
  49  | 
  50  |     // 4. Verify redirected to Application Detail view
  51  |     await expect(page).toHaveURL(/\/erp\/admin\/admissions\/[a-f0-9-]+/, { timeout: 15000 })
  52  |     await expect(page.locator('h2')).toContainText('Kabir Verma')
  53  |     await expect(page.locator('body')).toContainText('SUBMITTED')
  54  | 
  55  |     // 5. Start Review (submitted -> under_review)
  56  |     await page.click('button:has-text("Start Review")')
  57  |     await expect(page.locator('body')).toContainText('UNDER REVIEW', { timeout: 10000 })
  58  | 
  59  |     // 6. Approve Application (under_review -> approved)
  60  |     await page.click('button:has-text("Approve Application")')
  61  |     await expect(page.locator('body')).toContainText('APPROVED', { timeout: 10000 })
  62  | 
  63  |     // 7. Convert to Enrolled Student
  64  |     await page.click('button:has-text("Convert to Enrolled Student")')
  65  |     await expect(page.locator('h3:has-text("Convert Admission to Student")')).toBeVisible()
  66  | 
  67  |     // Submit conversion modal
  68  |     await page.click('button:has-text("Confirm Conversion")')
  69  | 
  70  |     // 8. Verify redirected to Student Profile
  71  |     await expect(page).toHaveURL(/\/erp\/admin\/students\/[a-f0-9-]+/, { timeout: 15000 })
  72  |     await expect(page.locator('h2')).toContainText('Kabir Verma')
  73  |     await expect(page.locator('body')).toContainText('ACTIVE')
  74  |   })
  75  | 
  76  |   test('2. Direct Administrative Student Enrollment', async ({ page }) => {
  77  |     // 1. Log in as Admin
  78  |     await page.goto('/login')
  79  |     await page.fill('input[name="email"]', 'admin@roshanischool.com')
  80  |     await page.fill('input[name="password"]', PASSWORD)
  81  |     await page.click('button[type="submit"]')
  82  |     await expect(page).toHaveURL(/\/erp\/(admin|select-role)/, { timeout: 15000 })
  83  | 
  84  |     // 2. Navigate to Direct Student Enrollment
  85  |     await page.goto('/erp/admin/students/new')
  86  |     await expect(page.locator('h1')).toContainText('Direct Administrative Enrollment')
  87  | 
  88  |     // Wait for sections to load asynchronously
  89  |     await page.waitForTimeout(1000)
  90  | 
  91  |     // 3. Fill direct student form
  92  |     await page.fill('input[name="first_name"]', 'Sanya')
  93  |     await page.fill('input[name="last_name"]', 'Mehta')
  94  |     await page.fill('input[name="date_of_birth"]', '2017-09-20')
  95  |     await page.selectOption('select[name="gender"]', 'female')
  96  | 
  97  |     await page.fill('input[name="guardian_name"]', 'Vikram Mehta')
  98  |     await page.selectOption('select[name="guardian_relationship"]', 'father')
  99  |     await page.fill('input[name="guardian_phone"]', '+919876500002')
  100 | 
  101 |     // Submit
  102 |     await page.click('button[type="submit"]')
  103 | 
  104 |     // 4. Verify redirected to Student Profile
> 105 |     await expect(page).toHaveURL(/\/erp\/admin\/students\/[a-f0-9-]+/, { timeout: 15000 })
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  106 |     await expect(page.locator('h2')).toContainText('Sanya Mehta')
  107 |   })
  108 | 
  109 |   test('3. Security Negative Authorization Checks', async ({ page }) => {
  110 |     // 1. Log in as Teacher
  111 |     await page.goto('/login')
  112 |     await page.fill('input[name="email"]', 'teacher@roshanischool.com')
  113 |     await page.fill('input[name="password"]', PASSWORD)
  114 |     await page.click('button[type="submit"]')
  115 |     await expect(page).toHaveURL(/\/erp\/teacher/)
  116 | 
  117 |     // Attempt accessing Admin Admissions
  118 |     await page.goto('/erp/admin/admissions')
  119 |     await expect(page).toHaveURL(/\/erp\/unauthorized/)
  120 | 
  121 |     // Attempt accessing Admin Students
  122 |     await page.goto('/erp/admin/students')
  123 |     await expect(page).toHaveURL(/\/erp\/unauthorized/)
  124 | 
  125 |     // 2. Log out cleanly & Log in as Accountant
  126 |     await page.click('button:has-text("Log out"), button:has-text("Sign Out"), button:has-text("Logout")')
  127 |     await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  128 | 
  129 |     await page.fill('input[name="email"]', 'accountant@roshanischool.com')
  130 |     await page.fill('input[name="password"]', PASSWORD)
  131 |     await page.click('button[type="submit"]')
  132 |     await expect(page).toHaveURL(/\/erp\/accountant/)
  133 | 
  134 |     // Attempt accessing New Student Creation
  135 |     await page.goto('/erp/admin/students/new')
  136 |     await expect(page).toHaveURL(/\/erp\/unauthorized/)
  137 |   })
  138 | })
  139 | 
```