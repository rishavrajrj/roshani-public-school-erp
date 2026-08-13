# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-verification.spec.ts >> Phase 2 Auth & Portal Access Verification >> 10. Unprovisioned User
- Location: e2e\auth-verification.spec.ts:126:7

# Error details

```
Test timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - banner [ref=f1e3]:
      - generic [ref=f1e4]:
        - link "Roshani Public School ERP" [ref=f1e7] [cursor=pointer]:
          - /url: /erp/admin
        - button "Log out" [ref=f1e10]
    - main [ref=f1e11]:
      - generic [ref=f1e13]:
        - heading "Account Not Provisioned" [level=2] [ref=f1e17]
        - paragraph [ref=f1e18]: Your account has not been provisioned for the ERP system. Please contact your school administrator to grant you access.
        - generic [ref=f1e19]:
          - link "Return to Login" [ref=f1e20] [cursor=pointer]:
            - /url: /login
          - button "Log out" [ref=f1e22]
  - alert [ref=f1e23]
```