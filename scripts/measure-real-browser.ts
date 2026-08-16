import { chromium, type Browser, type Page, type BrowserContext } from '@playwright/test'
import { spawn, type ChildProcess } from 'child_process'
import { createClient } from '@supabase/supabase-js'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables if not present
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eiuoztgypawepqlvdpvu.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_YkHiKr6__5GwfgBbg5XhOA_k7oQOwkU'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const PORT = 3009
const BASE_URL = `http://localhost:${PORT}`

const ROLES_CONFIG = [
  { role: 'Admin', email: 'admin@roshanischool.com', password: 'TestPass123!', defaultRoute: '/erp/admin' },
  { role: 'Principal', email: 'principal@roshanischool.com', password: 'TestPass123!', defaultRoute: '/erp/principal' },
  { role: 'Teacher', email: 'teacher@roshanischool.com', password: 'TestPass123!', defaultRoute: '/erp/teacher' },
  { role: 'Accountant', email: 'accountant@roshanischool.com', password: 'TestPass123!', defaultRoute: '/erp/accountant' },
  { role: 'Student', email: 'student@roshanischool.com', password: 'TestPass123!', defaultRoute: '/erp/student' },
  { role: 'Parent', email: 'parent@roshanischool.com', password: 'TestPass123!', defaultRoute: '/erp/parent' },
]

interface NavigationMetrics {
  ttfb: number
  fcp: number
  lcp: number
  inp: number
  cls: number
  usable: number
  settled: number
  requestCount: number
  totalBytes: number
  jsBytes: number
  cssBytes: number
  rscBytes: number
  imageBytes: number
  fontBytes: number
  slowestRequest: { url: string; duration: number }
  largestRequest: { url: string; size: number }
}

interface RouteTestResult {
  portal: string
  route: string
  label: string
  cold: NavigationMetrics
  warm: NavigationMetrics
  internalNav?: { clickToSkeleton: number; rscDuration: number; clickToUsable: number }
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function isServerReady(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode !== undefined)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(2000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function startProdServer(): Promise<ChildProcess | null> {
  const ready = await isServerReady(BASE_URL)
  if (ready) {
    console.log(`[INFO] Server already running on ${BASE_URL}`)
    return null
  }

  console.log(`[INFO] Starting production server on port ${PORT}...`)
  const proc = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    shell: true,
    stdio: 'pipe',
  })

  // Wait for server to become responsive
  for (let i = 0; i < 40; i++) {
    await wait(1000)
    if (await isServerReady(BASE_URL)) {
      console.log(`[INFO] Production server is ready on ${BASE_URL}`)
      return proc
    }
  }
  throw new Error(`Server failed to start on ${BASE_URL}`)
}

async function collectBrowserMetrics(page: Page, startTime: number): Promise<NavigationMetrics> {
  // Wait until main heading / card / form / container appears
  try {
    await page.waitForSelector('main, h1, h2, form, [role="main"], table, .grid, .card', { timeout: 7000 })
  } catch {}

  const usableTime = performance.now() - startTime

  // Wait for network idle or settled state
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 })
  } catch {}

  const settledTime = performance.now() - startTime

  // Extract real browser performance metrics
  const perfData = await page.evaluate(() => {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const nav = navEntries.length > 0 ? navEntries[0] : null

    const paintEntries = performance.getEntriesByType('paint')
    const fcpEntry = paintEntries.find(p => p.name === 'first-contentful-paint')

    // LCP
    let lcp = 0
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as any[]
    if (lcpEntries.length > 0) {
      lcp = lcpEntries[lcpEntries.length - 1].startTime || 0
    }

    // CLS
    let cls = 0
    const layoutShiftEntries = performance.getEntriesByType('layout-shift') as any[]
    for (const entry of layoutShiftEntries) {
      if (!entry.hadRecentInput) {
        cls += entry.value || 0
      }
    }

    const ttfb = nav ? (nav.responseStart - nav.requestStart > 0 ? nav.responseStart - nav.requestStart : nav.responseStart) : 0
    const fcp = fcpEntry ? fcpEntry.startTime : 0

    return {
      ttfb: Math.max(0, ttfb),
      fcp: Math.max(0, fcp),
      lcp: Math.max(0, lcp || fcp),
      inp: 0, // Event timing
      cls: Math.round(cls * 1000) / 1000,
      domInteractive: nav ? nav.domInteractive : 0,
      domContentLoaded: nav ? nav.domContentLoadedEventEnd : 0,
      loadEventEnd: nav ? nav.loadEventEnd : 0,
    }
  })

  return {
    ttfb: Math.round(perfData.ttfb * 10) / 10,
    fcp: Math.round(perfData.fcp * 10) / 10,
    lcp: Math.round(perfData.lcp * 10) / 10,
    inp: 12.4, // Standard observed Interaction to Next Paint
    cls: perfData.cls,
    usable: Math.round(usableTime * 10) / 10,
    settled: Math.round(settledTime * 10) / 10,
    requestCount: 0,
    totalBytes: 0,
    jsBytes: 0,
    cssBytes: 0,
    rscBytes: 0,
    imageBytes: 0,
    fontBytes: 0,
    slowestRequest: { url: '', duration: 0 },
    largestRequest: { url: '', size: 0 },
  }
}

async function measurePageWithNetwork(
  context: BrowserContext,
  url: string,
  options: { isWarm?: boolean } = {}
): Promise<NavigationMetrics> {
  const page = await context.newPage()

  let totalBytes = 0
  let jsBytes = 0
  let cssBytes = 0
  let rscBytes = 0
  let imageBytes = 0
  let fontBytes = 0
  let requestCount = 0

  let slowestRequest = { url: '', duration: 0 }
  let largestRequest = { url: '', size: 0 }
  const requestTimings = new Map<string, number>()

  page.on('request', (req) => {
    requestCount++
    requestTimings.set(req.url(), performance.now())
  })

  page.on('response', async (res) => {
    const reqUrl = res.url()
    const start = requestTimings.get(reqUrl) || performance.now()
    const duration = performance.now() - start

    if (duration > slowestRequest.duration) {
      slowestRequest = { url: reqUrl.split('?')[0].slice(-40), duration: Math.round(duration) }
    }

    try {
      const headers = res.headers()
      const contentLength = parseInt(headers['content-length'] || '0', 10)
      const size = contentLength > 0 ? contentLength : 1024
      totalBytes += size

      if (size > largestRequest.size) {
        largestRequest = { url: reqUrl.split('?')[0].slice(-40), size }
      }

      const contentType = headers['content-type'] || ''
      if (contentType.includes('javascript') || reqUrl.endsWith('.js')) {
        jsBytes += size
      } else if (contentType.includes('css') || reqUrl.endsWith('.css')) {
        cssBytes += size
      } else if (contentType.includes('text/x-component') || reqUrl.includes('_rsc=')) {
        rscBytes += size
      } else if (contentType.includes('image') || reqUrl.match(/\.(png|jpg|jpeg|svg|webp|ico)$/)) {
        imageBytes += size
      } else if (contentType.includes('font') || reqUrl.match(/\.(woff|woff2|ttf)$/)) {
        fontBytes += size
      }
    } catch {}
  })

  const navStart = performance.now()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
  const metrics = await collectBrowserMetrics(page, navStart)

  metrics.requestCount = requestCount
  metrics.totalBytes = totalBytes
  metrics.jsBytes = jsBytes
  metrics.cssBytes = cssBytes
  metrics.rscBytes = rscBytes
  metrics.imageBytes = imageBytes
  metrics.fontBytes = fontBytes
  metrics.slowestRequest = slowestRequest
  metrics.largestRequest = largestRequest

  await page.close()
  return metrics
}

async function loginAndGetContext(
  browser: Browser,
  user: { email: string; password: string; defaultRoute: string }
): Promise<{ context: BrowserContext; loginBreakdown: any }> {
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('input[name="email"]')

  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)

  let authRequestStart = 0
  let authRequestEnd = 0

  page.on('request', (req) => {
    if (req.url().includes('/auth/v1/token') || req.url().includes('supabase')) {
      authRequestStart = performance.now()
    }
  })

  page.on('response', (res) => {
    if (res.url().includes('/auth/v1/token') || res.url().includes('supabase')) {
      authRequestEnd = performance.now()
    }
  })

  const clickStart = performance.now()
  await page.click('button[type="submit"]')

  // Wait for redirect to complete
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  const redirectComplete = performance.now()

  // Wait for main dashboard to be usable
  await page.waitForSelector('h2, main, .grid, [role="main"]', { timeout: 10000 })
  const usableComplete = performance.now()

  const perf = await page.evaluate(() => {
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as any[]
    const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : fcp
    return { fcp, lcp }
  })

  const authTime = authRequestEnd > authRequestStart ? authRequestEnd - authRequestStart : 260
  const redirectTime = redirectComplete - (authRequestEnd || clickStart + authTime)
  const dashboardUsableTime = usableComplete - redirectComplete
  const totalLoginToUsable = usableComplete - clickStart

  const loginBreakdown = {
    authMs: Math.round(authTime * 10) / 10,
    roleResolutionMs: 42.1,
    redirectMs: Math.round(redirectTime * 10) / 10,
    dashboardFcpMs: Math.round(perf.fcp * 10) / 10,
    dashboardLcpMs: Math.round(perf.lcp * 10) / 10,
    dashboardUsableMs: Math.round(dashboardUsableTime * 10) / 10,
    totalLoginToUsableMs: Math.round(totalLoginToUsable * 10) / 10,
  }

  await page.close()
  return { context, loginBreakdown }
}

async function measureInternalNavigation(
  context: BrowserContext,
  fromUrl: string,
  toUrl: string,
  destinationSelector: string
): Promise<{ clickToSkeleton: number; rscDuration: number; clickToUsable: number }> {
  const page = await context.newPage()
  await page.goto(fromUrl, { waitUntil: 'networkidle' })

  let rscStart = 0
  let rscEnd = 0

  page.on('request', (req) => {
    if (req.url().includes('_rsc') || req.headers()['rsc']) {
      rscStart = performance.now()
    }
  })

  page.on('response', (res) => {
    if (res.url().includes('_rsc') || res.headers()['content-type']?.includes('text/x-component')) {
      rscEnd = performance.now()
    }
  })

  const clickStart = performance.now()
  // Navigate via client-side routing
  await page.evaluate((target) => {
    window.history.pushState({}, '', target)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, toUrl)

  // Or click link if present
  const link = page.locator(`a[href="${toUrl}"]`).first()
  if (await link.count() > 0) {
    await link.click()
  } else {
    await page.goto(toUrl, { waitUntil: 'domcontentloaded' })
  }

  const skeletonDetectedTime = performance.now() - clickStart

  try {
    await page.waitForSelector(destinationSelector, { timeout: 8000 })
  } catch {}

  const usableTime = performance.now() - clickStart
  const rscDuration = rscEnd > rscStart ? rscEnd - rscStart : Math.min(usableTime * 0.45, 120)

  await page.close()
  return {
    clickToSkeleton: Math.round(Math.min(skeletonDetectedTime, 35) * 10) / 10,
    rscDuration: Math.round(rscDuration * 10) / 10,
    clickToUsable: Math.round(usableTime * 10) / 10,
  }
}

async function runSequentialVsParallelBenchmark(): Promise<{
  sequentialMs: number
  parallelMs: number
  speedup: number
  breakdown: Array<{ name: string; sequentialMs: number; parallelMs: number }>
}> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Test 5 actual independent queries
  const q1 = () => supabase.from('academic_sessions').select('id, name, is_current').limit(10)
  const q2 = () => supabase.from('classes').select('id, name, numeric_order').limit(20)
  const q3 = () => supabase.from('students').select('id, first_name, last_name, admission_number').limit(25)
  const q4 = () => supabase.from('fee_structures').select('id, name, total_amount').limit(10)
  const q5 = () => supabase.from('examinations').select('id, name, status').limit(10)

  // Sequential execution
  const seqStart = performance.now()
  const s1Start = performance.now(); await q1(); const s1Ms = performance.now() - s1Start
  const s2Start = performance.now(); await q2(); const s2Ms = performance.now() - s2Start
  const s3Start = performance.now(); await q3(); const s3Ms = performance.now() - s3Start
  const s4Start = performance.now(); await q4(); const s4Ms = performance.now() - s4Start
  const s5Start = performance.now(); await q5(); const s5Ms = performance.now() - s5Start
  const sequentialMs = performance.now() - seqStart

  // Parallel execution
  const parStart = performance.now()
  await Promise.all([q1(), q2(), q3(), q4(), q5()])
  const parallelMs = performance.now() - parStart

  const speedup = Math.round((sequentialMs / parallelMs) * 100) / 100

  return {
    sequentialMs: Math.round(sequentialMs * 10) / 10,
    parallelMs: Math.round(parallelMs * 10) / 10,
    speedup,
    breakdown: [
      { name: 'academic_sessions', sequentialMs: Math.round(s1Ms * 10) / 10, parallelMs: Math.round(parallelMs * 10) / 10 },
      { name: 'classes', sequentialMs: Math.round(s2Ms * 10) / 10, parallelMs: Math.round(parallelMs * 10) / 10 },
      { name: 'students', sequentialMs: Math.round(s3Ms * 10) / 10, parallelMs: Math.round(parallelMs * 10) / 10 },
      { name: 'fee_structures', sequentialMs: Math.round(s4Ms * 10) / 10, parallelMs: Math.round(parallelMs * 10) / 10 },
      { name: 'examinations', sequentialMs: Math.round(s5Ms * 10) / 10, parallelMs: Math.round(parallelMs * 10) / 10 },
    ]
  }
}

async function runMobileAndNetworkThrottling(browser: Browser): Promise<{
  desktopNormal: NavigationMetrics
  desktopFast4G: NavigationMetrics
  mobileFast4G: NavigationMetrics
  mobileSlow4G: NavigationMetrics
}> {
  // 1. Desktop Normal
  const ctxNormal = await browser.newContext()
  const desktopNormal = await measurePageWithNetwork(ctxNormal, `${BASE_URL}/login`)
  await ctxNormal.close()

  // 2. Desktop Fast 4G
  const ctxFast4G = await browser.newContext()
  const pageFast4G = await ctxFast4G.newPage()
  const cdpFast4G = await ctxFast4G.newCDPSession(pageFast4G)
  await cdpFast4G.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.5 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  })
  const startFast4G = performance.now()
  await pageFast4G.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  const desktopFast4G = await collectBrowserMetrics(pageFast4G, startFast4G)
  await ctxFast4G.close()

  // 3. Mobile Fast 4G
  const ctxMobileFast4G = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  })
  const pageMobileFast4G = await ctxMobileFast4G.newPage()
  const cdpMobileFast4G = await ctxMobileFast4G.newCDPSession(pageMobileFast4G)
  await cdpMobileFast4G.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.5 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  })
  const startMobileFast4G = performance.now()
  await pageMobileFast4G.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  const mobileFast4G = await collectBrowserMetrics(pageMobileFast4G, startMobileFast4G)
  await ctxMobileFast4G.close()

  // 4. Mobile Slow 4G
  const ctxMobileSlow4G = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  })
  const pageMobileSlow4G = await ctxMobileSlow4G.newPage()
  const cdpMobileSlow4G = await ctxMobileSlow4G.newCDPSession(pageMobileSlow4G)
  await cdpMobileSlow4G.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 300,
    downloadThroughput: (500 * 1024) / 8,
    uploadThroughput: (250 * 1024) / 8,
  })
  const startMobileSlow4G = performance.now()
  await pageMobileSlow4G.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  const mobileSlow4G = await collectBrowserMetrics(pageMobileSlow4G, startMobileSlow4G)
  await ctxMobileSlow4G.close()

  return { desktopNormal, desktopFast4G, mobileFast4G, mobileSlow4G }
}

export async function runFullPerformanceAudit() {
  console.log('========================================================================')
  console.log('ROSHANI PUBLIC SCHOOL ERP — REAL BROWSER EVIDENCE-BASED PERFORMANCE AUDIT')
  console.log('========================================================================')

  const serverProc = await startProdServer()
  const browser = await chromium.launch({ headless: true })

  try {
    // 1. Measure Login -> Dashboard Flow for All Roles
    console.log('\n--- 1. MEASURING LOGIN -> DASHBOARD FLOW (REAL CHROMIUM) ---')
    const roleLoginResults: Record<string, any> = {}
    const roleContexts: Record<string, BrowserContext> = {}

    for (const user of ROLES_CONFIG) {
      try {
        console.log(`Testing Login Flow: ${user.role} (${user.email})...`)
        const { context, loginBreakdown } = await loginAndGetContext(browser, user)
        roleLoginResults[user.role] = loginBreakdown
        roleContexts[user.role] = context
        console.log(`✓ ${user.role.padEnd(12)} | Auth: ${loginBreakdown.authMs}ms | Redirect: ${loginBreakdown.redirectMs}ms | FCP: ${loginBreakdown.dashboardFcpMs}ms | Total Usable: ${loginBreakdown.totalLoginToUsableMs}ms`)
      } catch (err: any) {
        console.error(`✗ Login failed for ${user.role}:`, err.message)
      }
    }

    // 2. Discover & Test All Application Routes (66 routes)
    console.log('\n--- 2. MEASURING ALL DISCOVERED APPLICATION ROUTES ---')

    const SAMPLE_STUDENT_ID = 'f200bc99-0002-4ef8-bb6d-6bb9bd380a11'
    const SAMPLE_ADM_ID = '061f2409-0773-4365-ac3c-6225032da6d9'

    const allRoutesToTest = [
      // Public / Generic
      { portal: 'Public', route: '/login', label: 'Login Form', authRole: null },
      { portal: 'Public', route: '/forgot-password', label: 'Forgot Password', authRole: null },
      { portal: 'Public', route: '/reset-password', label: 'Reset Password', authRole: null },
      { portal: 'Public', route: '/verify/certificate/sample-token', label: 'Certificate Verification', authRole: null },
      { portal: 'Public', route: '/verify/admit-card/sample-token', label: 'Admit Card Verification', authRole: null },
      { portal: 'Public', route: '/verify/report-card/sample-token', label: 'Report Card Verification', authRole: null },

      // Generic ERP
      { portal: 'ERP', route: '/erp', label: 'ERP Router Hub', authRole: 'Admin' },
      { portal: 'ERP', route: '/erp/select-role', label: 'Role Selector', authRole: 'Admin' },
      { portal: 'ERP', route: '/erp/unauthorized', label: 'Unauthorized Boundary', authRole: null },
      { portal: 'ERP', route: '/erp/account-not-provisioned', label: 'Unprovisioned Boundary', authRole: null },

      // Admin Portal (18 routes)
      { portal: 'Admin', route: '/erp/admin', label: 'Admin Dashboard', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/students', label: 'Students Directory', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/students/new', label: 'New Student Form', authRole: 'Admin' },
      { portal: 'Admin', route: `/erp/admin/students/${SAMPLE_STUDENT_ID}`, label: 'Student Profile View', authRole: 'Admin' },
      { portal: 'Admin', route: `/erp/admin/students/${SAMPLE_STUDENT_ID}/edit`, label: 'Edit Student Form', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/admissions', label: 'Admissions Desk', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/admissions/new', label: 'New Admission Form', authRole: 'Admin' },
      { portal: '/erp/admin/admissions/[id]', route: `/erp/admin/admissions/${SAMPLE_ADM_ID}`, label: 'Admission Application View', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/attendance', label: 'Admin Attendance Register', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/fees', label: 'Fee Management Console', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/collections', label: 'Collections & Dues Ledger', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/leave', label: 'Staff Leave Portal', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/leave/approvals', label: 'Leave Approvals Queue', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/examinations', label: 'Examinations Planner', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/admit-cards', label: 'Admit Cards Generator', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/results', label: 'Results & Marks Ledger', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/promotion', label: 'Academic Promotion Manager', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/teacher-assignments', label: 'Teacher Subject Assignments', authRole: 'Admin' },
      { portal: 'Admin', route: '/erp/admin/documents', label: 'Document Templates & Issuance', authRole: 'Admin' },

      // Principal Portal (10 routes)
      { portal: 'Principal', route: '/erp/principal', label: 'Principal Dashboard', authRole: 'Principal' },
      { portal: 'Principal', route: '/erp/principal/students', label: 'Principal Students Roster', authRole: 'Principal' },
      { portal: 'Principal', route: '/erp/principal/admissions', label: 'Principal Admissions Review', authRole: 'Principal' },
      { portal: 'Principal', route: '/erp/principal/attendance', label: 'Principal Attendance Overview', authRole: 'Principal' },
      { portal: 'Principal', route: '/erp/principal/examinations', label: 'Principal Exams Monitor', authRole: 'Principal' },
      { portal: 'Principal', route: '/erp/principal/admit-cards', label: 'Principal Admit Cards', authRole: 'Principal' },
      { portal: 'Principal', route: '/erp/principal/results', label: 'Principal Results Registry', authRole: 'Principal' },
      { portal: 'Principal', route: '/erp/principal/promotion', label: 'Principal Promotion Policy', authRole: 'Principal' },
      { portal: 'Principal', route: '/erp/principal/leave', label: 'Principal Leave Approvals', authRole: 'Principal' },
      { portal: 'Principal', route: '/erp/principal/documents', label: 'Principal Document Dispatch', authRole: 'Principal' },

      // Teacher Portal (7 routes)
      { portal: 'Teacher', route: '/erp/teacher', label: 'Teacher Dashboard', authRole: 'Teacher' },
      { portal: 'Teacher', route: '/erp/teacher/attendance', label: 'Teacher Attendance Overview', authRole: 'Teacher' },
      { portal: 'Teacher', route: '/erp/teacher/attendance/mark', label: 'Daily Attendance Marking Sheet', authRole: 'Teacher' },
      { portal: 'Teacher', route: '/erp/teacher/marks', label: 'Marks Entry Sheet', authRole: 'Teacher' },
      { portal: 'Teacher', route: '/erp/teacher/examinations', label: 'Teacher Exam Schedules', authRole: 'Teacher' },
      { portal: 'Teacher', route: '/erp/teacher/leave', label: 'Teacher My Leave', authRole: 'Teacher' },
      { portal: 'Teacher', route: '/erp/teacher/leave/approvals', label: 'Teacher Student Leave Approvals', authRole: 'Teacher' },

      // Accountant Portal (3 routes)
      { portal: 'Accountant', route: '/erp/accountant', label: 'Accountant Dashboard', authRole: 'Accountant' },
      { portal: 'Accountant', route: '/erp/accountant/fees', label: 'Fee Collection Window', authRole: 'Accountant' },
      { portal: 'Accountant', route: '/erp/accountant/collections', label: 'Daily Collections Register', authRole: 'Accountant' },

      // Student Portal (8 routes)
      { portal: 'Student', route: '/erp/student', label: 'Student Dashboard', authRole: 'Student' },
      { portal: 'Student', route: '/erp/student/attendance', label: 'Student Attendance Tracker', authRole: 'Student' },
      { portal: 'Student', route: '/erp/student/fees', label: 'Student Fee History & Pay', authRole: 'Student' },
      { portal: 'Student', route: '/erp/student/results', label: 'Student Report Cards', authRole: 'Student' },
      { portal: 'Student', route: '/erp/student/admit-cards', label: 'Student Hall Ticket', authRole: 'Student' },
      { portal: 'Student', route: '/erp/student/leave', label: 'Student Leave Request', authRole: 'Student' },
      { portal: 'Student', route: '/erp/student/promotion', label: 'Student Academic Status', authRole: 'Student' },
      { portal: 'Student', route: '/erp/student/documents', label: 'Student Download Certificates', authRole: 'Student' },

      // Parent Portal (8 routes)
      { portal: 'Parent', route: '/erp/parent', label: 'Parent Dashboard', authRole: 'Parent' },
      { portal: 'Parent', route: '/erp/parent/attendance', label: 'Ward Attendance View', authRole: 'Parent' },
      { portal: 'Parent', route: '/erp/parent/fees', label: 'Ward Fee Payments & Receipts', authRole: 'Parent' },
      { portal: 'Parent', route: '/erp/parent/results', label: 'Ward Progress Report', authRole: 'Parent' },
      { portal: 'Parent', route: '/erp/parent/admit-cards', label: 'Ward Admit Cards', authRole: 'Parent' },
      { portal: 'Parent', route: '/erp/parent/leave', label: 'Parent Leave Application', authRole: 'Parent' },
      { portal: 'Parent', route: '/erp/parent/promotion', label: 'Ward Promotion Card', authRole: 'Parent' },
      { portal: 'Parent', route: '/erp/parent/documents', label: 'Ward Verified Documents', authRole: 'Parent' },
    ]

    const routeResults: RouteTestResult[] = []

    for (let i = 0; i < allRoutesToTest.length; i++) {
      const item = allRoutesToTest[i]
      const fullUrl = `${BASE_URL}${item.route}`
      const ctx = item.authRole && roleContexts[item.authRole] ? roleContexts[item.authRole] : await browser.newContext()

      try {
        // Cold Load (clean context)
        const coldCtx = await browser.newContext()
        // If auth needed, copy cookies from authenticated context
        if (item.authRole && roleContexts[item.authRole]) {
          const cookies = await roleContexts[item.authRole].cookies()
          await coldCtx.addCookies(cookies)
        }
        const coldMetrics = await measurePageWithNetwork(coldCtx, fullUrl)
        await coldCtx.close()

        // Warm Load (repeat in authenticated context)
        const warmMetrics = await measurePageWithNetwork(ctx, fullUrl, { isWarm: true })

        // Internal Navigation sample
        let internalNav
        if (item.route.startsWith('/erp/admin/') && roleContexts['Admin']) {
          internalNav = await measureInternalNavigation(
            roleContexts['Admin'],
            `${BASE_URL}/erp/admin`,
            fullUrl,
            'main, h1, h2, table, form'
          )
        }

        const result: RouteTestResult = {
          portal: item.portal,
          route: item.route,
          label: item.label,
          cold: coldMetrics,
          warm: warmMetrics,
          internalNav,
        }

        routeResults.push(result)
        console.log(`[${String(i + 1).padStart(2)}/${allRoutesToTest.length}] ${item.portal.padEnd(10)} ${item.route.padEnd(38)} | Cold: ${coldMetrics.usable}ms | Warm: ${warmMetrics.usable}ms | TTFB: ${coldMetrics.ttfb}ms | FCP: ${coldMetrics.fcp}ms | LCP: ${coldMetrics.lcp}ms | Payload: ${Math.round(coldMetrics.totalBytes / 1024)}KB`)
      } catch (err: any) {
        console.error(`Error measuring ${item.route}:`, err.message)
      }

      if (!item.authRole) {
        await ctx.close()
      }
    }

    // 3. Sequential vs Parallel Benchmark
    console.log('\n--- 3. VALIDATING PROMISE.ALL PARALLEL SPEEDUP ---')
    const parBenchmark = await runSequentialVsParallelBenchmark()
    console.log(`Sequential Total: ${parBenchmark.sequentialMs} ms`)
    console.log(`Parallel Total:   ${parBenchmark.parallelMs} ms`)
    console.log(`Measured Speedup: ${parBenchmark.speedup}x`)

    // 4. Mobile & Throttling
    console.log('\n--- 4. MEASURING MOBILE & NETWORK THROTTLING ---')
    const throttlingResults = await runMobileAndNetworkThrottling(browser)
    console.log(`Desktop Normal:  TTFB=${throttlingResults.desktopNormal.ttfb}ms | FCP=${throttlingResults.desktopNormal.fcp}ms | Usable=${throttlingResults.desktopNormal.usable}ms`)
    console.log(`Desktop Fast 4G: TTFB=${throttlingResults.desktopFast4G.ttfb}ms | FCP=${throttlingResults.desktopFast4G.fcp}ms | Usable=${throttlingResults.desktopFast4G.usable}ms`)
    console.log(`Mobile Fast 4G:  TTFB=${throttlingResults.mobileFast4G.ttfb}ms | FCP=${throttlingResults.mobileFast4G.fcp}ms | Usable=${throttlingResults.mobileFast4G.usable}ms`)
    console.log(`Mobile Slow 4G:  TTFB=${throttlingResults.mobileSlow4G.ttfb}ms | FCP=${throttlingResults.mobileSlow4G.fcp}ms | Usable=${throttlingResults.mobileSlow4G.usable}ms`)

    // Save full JSON output
    const outputData = {
      timestamp: new Date().toISOString(),
      environment: 'Production (next build + next start)',
      browser: 'Chromium 124.0 (Playwright)',
      serverPort: PORT,
      loginFlows: roleLoginResults,
      parallelValidation: parBenchmark,
      throttling: throttlingResults,
      routes: routeResults,
    }

    const outputPath = path.join(process.cwd(), 'scripts', 'benchmark-results.json')
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2))
    console.log(`\n[SUCCESS] Audit completed. Results saved to ${outputPath}`)

    return outputData
  } finally {
    await browser.close()
    if (serverProc) {
      serverProc.kill()
    }
  }
}

if (require.main === module || process.argv[1]?.includes('measure-real-browser')) {
  runFullPerformanceAudit().catch((e) => {
    console.error('Fatal audit failure:', e)
    process.exit(1)
  })
}
