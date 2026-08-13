# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-verification.spec.ts >> Phase 2 Auth & Portal Access Verification >> 12. Logout Flow & Invalidation
- Location: e2e\auth-verification.spec.ts:150:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/erp\/(admin|select-role)/
Received string:  "http://localhost:3000/login"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    23 × locator resolved to <html lang="en" class="geist_a71539c9-module__T19VSG__variable geist_mono_8d43a2aa-module__8Li5zG__variable h-full antialiased">…</html>
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
  56  |   test('5. Teacher Authorization', async ({ page }) => {
  57  |     await page.goto('/login')
  58  |     await page.fill('input[name="email"]', 'teacher@roshanischool.com')
  59  |     await page.fill('input[name="password"]', PASSWORD)
  60  |     await page.click('button[type="submit"]')
  61  | 
  62  |     await expect(page).toHaveURL(/\/erp\/teacher/, { timeout: 10000 })
  63  | 
  64  |     await page.goto('/erp/admin')
  65  |     await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  66  | 
  67  |     await page.goto('/erp/principal')
  68  |     await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  69  |   })
  70  | 
  71  |   test('6. Accountant Authorization', async ({ page }) => {
  72  |     await page.goto('/login')
  73  |     await page.fill('input[name="email"]', 'accountant@roshanischool.com')
  74  |     await page.fill('input[name="password"]', PASSWORD)
  75  |     await page.click('button[type="submit"]')
  76  | 
  77  |     await expect(page).toHaveURL(/\/erp\/accountant/, { timeout: 10000 })
  78  | 
  79  |     await page.goto('/erp/admin')
  80  |     await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  81  |   })
  82  | 
  83  |   test('7. Parent Authorization', async ({ page }) => {
  84  |     await page.goto('/login')
  85  |     await page.fill('input[name="email"]', 'parent@roshanischool.com')
  86  |     await page.fill('input[name="password"]', PASSWORD)
  87  |     await page.click('button[type="submit"]')
  88  | 
  89  |     await expect(page).toHaveURL(/\/erp\/parent/, { timeout: 10000 })
  90  | 
  91  |     await page.goto('/erp/admin')
  92  |     await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  93  | 
  94  |     await page.goto('/erp/teacher')
  95  |     await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  96  |   })
  97  | 
  98  |   test('8. Student Authorization', async ({ page }) => {
  99  |     await page.goto('/login')
  100 |     await page.fill('input[name="email"]', 'student@roshanischool.com')
  101 |     await page.fill('input[name="password"]', PASSWORD)
  102 |     await page.click('button[type="submit"]')
  103 | 
  104 |     await expect(page).toHaveURL(/\/erp\/student/, { timeout: 10000 })
  105 | 
  106 |     await page.goto('/erp/admin')
  107 |     await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  108 | 
  109 |     await page.goto('/erp/teacher')
  110 |     await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  111 |   })
  112 | 
  113 |   test('9. Super Admin Authorization', async ({ page }) => {
  114 |     await page.goto('/login')
  115 |     await page.fill('input[name="email"]', 'superadmin@roshanischool.com')
  116 |     await page.fill('input[name="password"]', PASSWORD)
  117 |     await page.click('button[type="submit"]')
  118 | 
  119 |     await expect(page).toHaveURL(/\/erp\/(admin|select-role)/, { timeout: 10000 })
  120 |     if (page.url().includes('select-role')) {
  121 |       await page.goto('/erp/admin')
  122 |     }
  123 |     await expect(page.locator('h2')).toContainText('Admin Portal')
  124 |   })
  125 | 
  126 |   test('10. Unprovisioned User', async ({ page }) => {
  127 |     await page.goto('/login')
  128 |     await page.fill('input[name="email"]', 'unprovisioned@roshanischool.com')
  129 |     await page.fill('input[name="password"]', PASSWORD)
  130 |     await page.click('button[type="submit"]')
  131 | 
  132 |     await expect(page).toHaveURL(/\/erp\/account-not-provisioned/, { timeout: 10000 })
  133 | 
  134 |     await page.goto('/erp/admin')
  135 |     await expect(page).toHaveURL(/\/erp\/account-not-provisioned/, { timeout: 5000 })
  136 |   })
  137 | 
  138 |   test('11. Disabled User', async ({ page }) => {
  139 |     await page.goto('/login')
  140 |     await page.fill('input[name="email"]', 'disabled@roshanischool.com')
  141 |     await page.fill('input[name="password"]', PASSWORD)
  142 |     await page.click('button[type="submit"]')
  143 | 
  144 |     await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 10000 })
  145 | 
  146 |     await page.goto('/erp/admin')
  147 |     await expect(page).toHaveURL(/\/erp\/unauthorized/, { timeout: 5000 })
  148 |   })
  149 | 
  150 |   test('12. Logout Flow & Invalidation', async ({ page }) => {
  151 |     await page.goto('/login')
  152 |     await page.fill('input[name="email"]', 'admin@roshanischool.com')
  153 |     await page.fill('input[name="password"]', PASSWORD)
  154 |     await page.click('button[type="submit"]')
  155 | 
> 156 |     await expect(page).toHaveURL(/\/erp\/(admin|select-role)/, { timeout: 10000 })
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  157 |     if (page.url().includes('select-role')) {
  158 |       await page.goto('/erp/admin')
  159 |     }
  160 | 
  161 |     await page.click('button:has-text("Log out"), button:has-text("Sign Out"), button:has-text("Logout")')
  162 |     await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  163 | 
  164 |     await page.goto('/erp/admin')
  165 |     await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  166 | 
  167 |     await page.reload()
  168 |     await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  169 |   })
  170 | 
  171 |   test('13. Session Persistence', async ({ page }) => {
  172 |     await page.goto('/login')
  173 |     await page.fill('input[name="email"]', 'teacher@roshanischool.com')
  174 |     await page.fill('input[name="password"]', PASSWORD)
  175 |     await page.click('button[type="submit"]')
  176 | 
  177 |     await expect(page).toHaveURL(/\/erp\/teacher/, { timeout: 10000 })
  178 | 
  179 |     await page.reload()
  180 |     await expect(page).toHaveURL(/\/erp\/teacher/, { timeout: 5000 })
  181 |     await expect(page.locator('h2')).toContainText('Teacher Portal')
  182 |   })
  183 | })
  184 | 
```