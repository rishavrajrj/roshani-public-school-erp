import { chromium, type Browser, type Page, type BrowserContext } from '@playwright/test'
import { spawn, type ChildProcess } from 'child_process'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'

const PORT = 3009
const BASE_URL = `http://localhost:${PORT}`

const USERS = {
  Teacher: { email: 'teacher@roshanischool.com', password: 'TestPass123!', defaultRoute: '/erp/teacher' },
  Parent: { email: 'parent@roshanischool.com', password: 'TestPass123!', defaultRoute: '/erp/parent' },
  Accountant: { email: 'accountant@roshanischool.com', password: 'TestPass123!', defaultRoute: '/erp/accountant' },
}

const TARGET_ROUTES = [
  { portal: 'Teacher', route: '/erp/teacher/attendance', label: 'Teacher Attendance Overview', role: 'Teacher' as const },
  { portal: 'Parent', route: '/erp/parent/leave', label: 'Parent Leave Application', role: 'Parent' as const },
  { portal: 'Accountant', route: '/erp/accountant/fees', label: 'Fee Collection Window', role: 'Accountant' as const },
  { portal: 'Teacher', route: '/erp/teacher', label: 'Teacher Dashboard', role: 'Teacher' as const },
  { portal: 'Teacher', route: '/erp/teacher/marks', label: 'Marks Entry Sheet', role: 'Teacher' as const },
  { portal: 'Teacher', route: '/erp/teacher/leave/approvals', label: 'Teacher Student Leave Approvals', role: 'Teacher' as const },
  { portal: 'Parent', route: '/erp/parent', label: 'Parent Dashboard', role: 'Parent' as const },
]

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

  for (let i = 0; i < 40; i++) {
    await wait(1000)
    if (await isServerReady(BASE_URL)) {
      console.log(`[INFO] Production server is ready on ${BASE_URL}`)
      return proc
    }
  }
  throw new Error(`Server failed to start on ${BASE_URL}`)
}

async function loginAndGetContext(
  browser: Browser,
  user: { email: string; password: string; defaultRoute: string }
): Promise<BrowserContext> {
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('input[name="email"]')

  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)
  await page.click('button[type="submit"]')

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })
  await page.waitForSelector('h2, main, .grid, [role="main"]', { timeout: 10000 })

  await page.close()
  return context
}

interface SingleRunMetrics {
  ttfb: number
  fcp: number
  lcp: number
  usable: number
  totalBytes: number
  requestCount: number
}

interface MultiRunSummary {
  min: number
  max: number
  avg: number
  median: number
}

function calculateStats(numbers: number[]): MultiRunSummary {
  if (numbers.length === 0) return { min: 0, max: 0, avg: 0, median: 0 }
  const sorted = [...numbers].sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  const avg = Math.round((sum / sorted.length) * 10) / 10
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10
  return {
    min: Math.round(sorted[0] * 10) / 10,
    max: Math.round(sorted[sorted.length - 1] * 10) / 10,
    avg,
    median,
  }
}

async function measureSingleNavigation(
  context: BrowserContext,
  url: string
): Promise<SingleRunMetrics> {
  const page = await context.newPage()
  let requestCount = 0
  let totalBytes = 0

  page.on('request', () => {
    requestCount++
  })

  page.on('response', (res) => {
    try {
      const headers = res.headers()
      const contentLength = parseInt(headers['content-length'] || '0', 10)
      totalBytes += contentLength > 0 ? contentLength : 1024
    } catch {}
  })

  const navStart = performance.now()
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })

  try {
    await page.waitForSelector('main, h1, h2, form, [role="main"], table, .grid, .card', { timeout: 10000 })
  } catch {}

  const usable = performance.now() - navStart

  const perfData = await page.evaluate(() => {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const nav = navEntries.length > 0 ? navEntries[0] : null
    const paintEntries = performance.getEntriesByType('paint')
    const fcpEntry = paintEntries.find((p) => p.name === 'first-contentful-paint')
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as any[]
    const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime || 0 : (fcpEntry?.startTime || 0)

    const ttfb = nav ? (nav.responseStart - nav.requestStart > 0 ? nav.responseStart - nav.requestStart : nav.responseStart) : 0
    return {
      ttfb: Math.max(0, ttfb),
      fcp: fcpEntry ? fcpEntry.startTime : 0,
      lcp,
    }
  })

  await page.close()

  return {
    ttfb: Math.round(perfData.ttfb * 10) / 10,
    fcp: Math.round(perfData.fcp * 10) / 10,
    lcp: Math.round(perfData.lcp * 10) / 10,
    usable: Math.round(usable * 10) / 10,
    totalBytes,
    requestCount,
  }
}

async function measureClientSideNav(
  context: BrowserContext,
  fromUrl: string,
  toUrl: string
): Promise<number> {
  const page = await context.newPage()
  await page.goto(fromUrl, { waitUntil: 'networkidle' })

  const start = performance.now()
  const link = page.locator(`a[href="${toUrl}"]`).first()
  if (await link.count() > 0) {
    await link.click()
  } else {
    await page.goto(toUrl, { waitUntil: 'domcontentloaded' })
  }

  try {
    await page.waitForSelector('main, h1, h2, table, form, .grid, [role="main"]', { timeout: 10000 })
  } catch {}

  const usable = performance.now() - start
  await page.close()
  return Math.round(usable * 10) / 10
}

async function runBenchmark() {
  console.log('========================================================================')
  console.log('BENCHMARKING TARGET FIXED ERP ROUTES — REAL BROWSER MULTI-RUN AUDIT')
  console.log('========================================================================')

  const serverProc = await startProdServer()
  const browser = await chromium.launch({ headless: true })

  try {
    const roleContexts: Record<string, BrowserContext> = {}

    for (const [role, creds] of Object.entries(USERS)) {
      console.log(`Authenticating session for role: ${role}...`)
      roleContexts[role] = await loginAndGetContext(browser, creds)
    }

    const report: Array<{
      route: string
      label: string
      role: string
      coldUsable: MultiRunSummary
      coldTtfb: MultiRunSummary
      coldFcp: MultiRunSummary
      coldLcp: MultiRunSummary
      warmUsable: MultiRunSummary
      warmTtfb: MultiRunSummary
      warmFcp: MultiRunSummary
      warmLcp: MultiRunSummary
      navUsable: MultiRunSummary
      coldRuns: SingleRunMetrics[]
      warmRuns: SingleRunMetrics[]
      navRuns: number[]
    }> = []

    for (const target of TARGET_ROUTES) {
      console.log(`\n------------------------------------------------------------`)
      console.log(`Testing Route: ${target.route} (${target.label}) [Role: ${target.role}]`)
      console.log(`------------------------------------------------------------`)

      const fullUrl = `${BASE_URL}${target.route}`
      const baseAuthContext = roleContexts[target.role]
      const cookies = await baseAuthContext.cookies()

      // 1. Cold Runs (3 iterations with clean context but valid auth cookie)
      const coldRuns: SingleRunMetrics[] = []
      for (let c = 1; c <= 3; c++) {
        const freshCtx = await browser.newContext()
        await freshCtx.addCookies(cookies)
        const metrics = await measureSingleNavigation(freshCtx, fullUrl)
        coldRuns.push(metrics)
        await freshCtx.close()
        console.log(`  [Cold Run ${c}/3] Usable: ${metrics.usable}ms | TTFB: ${metrics.ttfb}ms | FCP: ${metrics.fcp}ms | LCP: ${metrics.lcp}ms`)
      }

      // 2. Warm Runs (5 iterations in persistent authenticated context)
      const warmRuns: SingleRunMetrics[] = []
      for (let w = 1; w <= 5; w++) {
        const metrics = await measureSingleNavigation(baseAuthContext, fullUrl)
        warmRuns.push(metrics)
        console.log(`  [Warm Run ${w}/5] Usable: ${metrics.usable}ms | TTFB: ${metrics.ttfb}ms | FCP: ${metrics.fcp}ms | LCP: ${metrics.lcp}ms`)
      }

      // 3. Navigation Runs (5 iterations via internal navigation)
      const navRuns: number[] = []
      const fromUrl = `${BASE_URL}/erp/${target.role.toLowerCase()}`
      for (let n = 1; n <= 5; n++) {
        const navTime = await measureClientSideNav(baseAuthContext, fromUrl, fullUrl)
        navRuns.push(navTime)
        console.log(`  [Nav Run ${n}/5]  Click -> Usable: ${navTime}ms`)
      }

      const coldUsableStats = calculateStats(coldRuns.map((r) => r.usable))
      const coldTtfbStats = calculateStats(coldRuns.map((r) => r.ttfb))
      const coldFcpStats = calculateStats(coldRuns.map((r) => r.fcp))
      const coldLcpStats = calculateStats(coldRuns.map((r) => r.lcp))

      const warmUsableStats = calculateStats(warmRuns.map((r) => r.usable))
      const warmTtfbStats = calculateStats(warmRuns.map((r) => r.ttfb))
      const warmFcpStats = calculateStats(warmRuns.map((r) => r.fcp))
      const warmLcpStats = calculateStats(warmRuns.map((r) => r.lcp))

      const navStats = calculateStats(navRuns)

      console.log(`\n  >> SUMMARY for ${target.route}:`)
      console.log(`     COLD Usable (3 runs): Min=${coldUsableStats.min}ms | Max=${coldUsableStats.max}ms | Avg=${coldUsableStats.avg}ms | Median=${coldUsableStats.median}ms`)
      console.log(`     WARM Usable (5 runs): Min=${warmUsableStats.min}ms | Max=${warmUsableStats.max}ms | Avg=${warmUsableStats.avg}ms | Median=${warmUsableStats.median}ms`)
      console.log(`     NAV  Usable (5 runs): Min=${navStats.min}ms | Max=${navStats.max}ms | Avg=${navStats.avg}ms | Median=${navStats.median}ms`)

      report.push({
        route: target.route,
        label: target.label,
        role: target.role,
        coldUsable: coldUsableStats,
        coldTtfb: coldTtfbStats,
        coldFcp: coldFcpStats,
        coldLcp: coldLcpStats,
        warmUsable: warmUsableStats,
        warmTtfb: warmTtfbStats,
        warmFcp: warmFcpStats,
        warmLcp: warmLcpStats,
        navUsable: navStats,
        coldRuns,
        warmRuns,
        navRuns,
      })
    }

    const outputPath = path.join(process.cwd(), 'scripts', 'fixed-routes-benchmark.json')
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
    console.log(`\n[SUCCESS] Benchmark completed. Output saved to ${outputPath}`)

    return report
  } finally {
    await browser.close()
    if (serverProc) {
      serverProc.kill()
    }
  }
}

runBenchmark().catch((err) => {
  console.error('Benchmark failed:', err)
  process.exit(1)
})
