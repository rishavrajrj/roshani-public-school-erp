import { createClient } from '@supabase/supabase-js'
import { loginSchema } from '../src/lib/auth/schemas'
import { ROLE_ROUTES } from '../src/lib/auth/constants'
import type { RoleName } from '../src/types/auth'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

interface StageMetric {
  role: string
  email: string
  clientValidationMs: number
  supabaseAuthMs: number
  unifiedResolutionMs: number
  redirectDecisionMs: number
  destinationDataMs: number
  totalLoginToDashboardMs: number
  targetRoute: string
}

async function measureOptimizedLogin(roleLabel: string, email: string, password = 'TestPass123!'): Promise<StageMetric> {
  // 1. Client-side validation timing (sub-millisecond)
  const valStart = performance.now()
  const parsed = loginSchema.safeParse({ email, password })
  const clientValidationMs = performance.now() - valStart

  if (!parsed.success) {
    throw new Error('Validation failed')
  }

  // 2. Supabase Auth signInWithPassword
  const authStart = performance.now()
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  const supabaseAuthMs = performance.now() - authStart

  if (authError || !authData.user) {
    throw new Error(`Auth failed: ${authError?.message}`)
  }

  // 3. Optimized: Single Unified PostgREST Query for Profile + Roles
  const resStart = performance.now()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id,
      school_id,
      full_name,
      status,
      avatar_url,
      user_roles!user_roles_profile_id_fkey (
        role_id,
        roles (
          name
        )
      )
    `)
    .eq('auth_user_id', authData.user.id)
    .single()
  const unifiedResolutionMs = performance.now() - resStart

  if (profileError || !profile) {
    throw new Error(`Profile lookup failed: ${profileError?.message}`)
  }

  const rawProfile = profile as Record<string, unknown>
  const roleRecords = rawProfile.user_roles as Array<{
    role_id: string
    roles: { name: string } | null
  }> | null

  const roles: string[] = []
  if (roleRecords && Array.isArray(roleRecords)) {
    for (const record of roleRecords) {
      if (record?.roles?.name) {
        roles.push(record.roles.name)
      }
    }
  }

  // 4. Deterministic Redirect decision
  const redirectStart = performance.now()
  let targetRoute = '/erp'
  if (roles.length === 1) {
    targetRoute = ROLE_ROUTES[roles[0] as RoleName] || '/erp'
  } else if (roles.length > 1) {
    targetRoute = '/erp/select-role'
  }
  const redirectDecisionMs = performance.now() - redirectStart

  // 5. Destination shell initial render data
  const destDataStart = performance.now()
  if (roleLabel === 'Admin' || roleLabel === 'Super Admin') {
    // Primary summary queries in parallel
    await Promise.all([
      supabase.from('students').select('id').eq('school_id', profile.school_id).eq('status', 'active').limit(5),
      supabase.from('admission_applications').select('id').eq('school_id', profile.school_id).limit(5),
    ])
  } else if (roleLabel === 'Teacher') {
    await supabase.from('classes').select('id').eq('school_id', profile.school_id).limit(5)
  } else if (roleLabel === 'Accountant') {
    await supabase.from('fee_payments').select('id').eq('school_id', profile.school_id).limit(5)
  } else if (roleLabel === 'Student') {
    await supabase.from('students').select('id').eq('profile_id', profile.id).single()
  } else if (roleLabel === 'Parent') {
    await supabase.from('guardians').select('id').eq('profile_id', profile.id).single()
  }
  const destinationDataMs = performance.now() - destDataStart

  const totalLoginToDashboardMs =
    clientValidationMs +
    supabaseAuthMs +
    unifiedResolutionMs +
    redirectDecisionMs +
    destinationDataMs

  return {
    role: roleLabel,
    email,
    clientValidationMs,
    supabaseAuthMs,
    unifiedResolutionMs,
    redirectDecisionMs,
    destinationDataMs,
    totalLoginToDashboardMs,
    targetRoute,
  }
}

async function runOptimizedBenchmark() {
  console.log('========================================================================')
  console.log('MEASURING OPTIMIZED LOGIN TIMELINE (REAL SUPABASE METRICS)')
  console.log('========================================================================')

  const roles = [
    { role: 'Super Admin', email: 'superadmin@roshanischool.com' },
    { role: 'Admin', email: 'admin@roshanischool.com' },
    { role: 'Principal', email: 'principal@roshanischool.com' },
    { role: 'Teacher', email: 'teacher@roshanischool.com' },
    { role: 'Accountant', email: 'accountant@roshanischool.com' },
    { role: 'Student', email: 'student@roshanischool.com' },
    { role: 'Parent', email: 'parent@roshanischool.com' },
  ]

  const results: StageMetric[] = []

  for (const r of roles) {
    try {
      const metric = await measureOptimizedLogin(r.role, r.email)
      results.push(metric)
      console.log(`✓ ${r.role.padEnd(12)} | Auth: ${metric.supabaseAuthMs.toFixed(1)}ms | Unified Res: ${metric.unifiedResolutionMs.toFixed(1)}ms | Dest Shell: ${metric.destinationDataMs.toFixed(1)}ms | Total: ${metric.totalLoginToDashboardMs.toFixed(1)}ms -> ${metric.targetRoute}`)
    } catch (e: any) {
      console.error(`✗ ${r.role} failed:`, e.message)
    }
  }

  // Measure Invalid Credentials
  const invStart = performance.now()
  const { error: invErr } = await supabase.auth.signInWithPassword({
    email: 'admin@roshanischool.com',
    password: 'WrongPassword123!',
  })
  const invDuration = performance.now() - invStart
  console.log(`\nInvalid Credentials Response Time: ${invDuration.toFixed(1)}ms (Error: ${invErr?.message})`)

  // Measure Returning User (Session exists, token refresh/getUser)
  const retStart = performance.now()
  const { data: userData } = await supabase.auth.getUser()
  const retDuration = performance.now() - retStart
  console.log(`Returning User Session Check Time: ${retDuration.toFixed(1)}ms`)
}

runOptimizedBenchmark().catch(console.error)
