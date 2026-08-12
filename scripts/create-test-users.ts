// ============================================================
// Test User Provisioning Script — Development Only
// ============================================================
// Usage: npx tsx scripts/create-test-users.ts
//
// SECURITY:
// - Uses SUPABASE_SERVICE_ROLE_KEY (server-side only, never committed)
// - Only for development/testing environments
// - Creates fictional test users with known passwords
// - Associates them with existing Phase 1 profiles/user_roles/roles
//
// PREREQUISITES:
// - SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
// - NEXT_PUBLIC_SUPABASE_URL must be set in .env.local
// - Phase 1 seed data must exist (school, roles, students, guardians)
//
// PRODUCTION:
// - This script must NEVER be run in production
// - Production users should be provisioned through admin workflows
// - Email confirmation should be ENABLED in production
// ============================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables.')
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Service-role client — bypasses RLS (server-side only!)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// ============================================================
// Existing Phase 1 IDs
// ============================================================
const SCHOOL_A_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

const ROLE_IDS = {
  'Super Admin': 'd100bc99-0001-4ef8-bb6d-6bb9bd380a11',
  'Admin': 'd100bc99-0002-4ef8-bb6d-6bb9bd380a11',
  'Principal': 'd100bc99-0003-4ef8-bb6d-6bb9bd380a11',
  'Accountant': 'd100bc99-0004-4ef8-bb6d-6bb9bd380a11',
  'Teacher': 'd100bc99-0005-4ef8-bb6d-6bb9bd380a11',
  'Parent': 'd100bc99-0006-4ef8-bb6d-6bb9bd380a11',
  'Student': 'd100bc99-0007-4ef8-bb6d-6bb9bd380a11',
} as const

// Existing student/guardian IDs from Phase 1 seed data
const STUDENT_ARJUN_ID = 'f200bc99-0001-4ef8-bb6d-6bb9bd380a11'
const GUARDIAN_RAJESH_ID = 'f100bc99-0001-4ef8-bb6d-6bb9bd380a11'

// ============================================================
// Test User Definitions
// ============================================================
const TEST_PASSWORD = 'TestPass123!'

interface TestUser {
  email: string
  fullName: string
  roles: (keyof typeof ROLE_IDS)[]
  status: 'active' | 'inactive' | 'suspended'
  linkStudentId?: string   // For student users
  linkGuardianId?: string  // For parent users
  skipProfile?: boolean    // For unprovisioned user test
}

const TEST_USERS: TestUser[] = [
  {
    email: 'superadmin@rps-test.local',
    fullName: 'Vijay Kumar (Super Admin)',
    roles: ['Super Admin'],
    status: 'active',
  },
  {
    email: 'admin@rps-test.local',
    fullName: 'Priya Sharma (Admin)',
    roles: ['Admin'],
    status: 'active',
  },
  {
    email: 'principal@rps-test.local',
    fullName: 'Dr. Ramesh Gupta (Principal)',
    roles: ['Principal'],
    status: 'active',
  },
  {
    email: 'teacher@rps-test.local',
    fullName: 'Sunita Devi (Teacher)',
    roles: ['Teacher'],
    status: 'active',
  },
  {
    email: 'accountant@rps-test.local',
    fullName: 'Manoj Verma (Accountant)',
    roles: ['Accountant'],
    status: 'active',
  },
  {
    email: 'parent@rps-test.local',
    fullName: 'Rajesh Kumar (Parent)',
    roles: ['Parent'],
    status: 'active',
    linkGuardianId: GUARDIAN_RAJESH_ID,
  },
  {
    email: 'student@rps-test.local',
    fullName: 'Arjun Kumar (Student)',
    roles: ['Student'],
    status: 'active',
    linkStudentId: STUDENT_ARJUN_ID,
  },
  {
    email: 'unprovisioned@rps-test.local',
    fullName: 'Unprovisioned User',
    roles: [],
    status: 'active',
    skipProfile: true,
  },
  {
    email: 'disabled@rps-test.local',
    fullName: 'Disabled Account',
    roles: ['Admin'],
    status: 'inactive',
  },
]

// ============================================================
// Provisioning Logic
// ============================================================
async function createTestUser(testUser: TestUser): Promise<void> {
  const label = `${testUser.email} (${testUser.roles.join(', ') || 'no roles'})`

  // 1. Create auth user via admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testUser.email,
    password: TEST_PASSWORD,
    email_confirm: true, // Auto-confirm for development
  })

  if (authError) {
    if (authError.message?.includes('already been registered')) {
      console.log(`⏭️  ${label} — already exists, skipping`)
      return
    }
    console.error(`❌ ${label} — auth creation failed:`, authError.message)
    return
  }

  const authUserId = authData.user.id
  console.log(`✅ Auth user created: ${label} (${authUserId})`)

  // 2. Skip profile for unprovisioned test user
  if (testUser.skipProfile) {
    console.log(`   ℹ️  Skipped profile/roles (unprovisioned test user)`)
    return
  }

  // 3. Create profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      auth_user_id: authUserId,
      school_id: SCHOOL_A_ID,
      full_name: testUser.fullName,
      status: testUser.status,
    })
    .select('id')
    .single()

  if (profileError) {
    console.error(`❌ ${label} — profile creation failed:`, profileError.message)
    return
  }

  console.log(`   ✅ Profile created: ${profile.id}`)

  // 4. Assign roles
  for (const roleName of testUser.roles) {
    const roleId = ROLE_IDS[roleName]
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        profile_id: profile.id,
        role_id: roleId,
        school_id: SCHOOL_A_ID,
      })

    if (roleError) {
      console.error(`   ❌ Role ${roleName} assignment failed:`, roleError.message)
    } else {
      console.log(`   ✅ Role assigned: ${roleName}`)
    }
  }

  // 5. Link student record if applicable
  if (testUser.linkStudentId) {
    const { error } = await supabase
      .from('students')
      .update({ profile_id: profile.id })
      .eq('id', testUser.linkStudentId)

    if (error) {
      console.error(`   ❌ Student link failed:`, error.message)
    } else {
      console.log(`   ✅ Linked to student: ${testUser.linkStudentId}`)
    }
  }

  // 6. Link guardian record if applicable
  if (testUser.linkGuardianId) {
    const { error } = await supabase
      .from('guardians')
      .update({ profile_id: profile.id })
      .eq('id', testUser.linkGuardianId)

    if (error) {
      console.error(`   ❌ Guardian link failed:`, error.message)
    } else {
      console.log(`   ✅ Linked to guardian: ${testUser.linkGuardianId}`)
    }
  }
}

async function main() {
  console.log('============================================================')
  console.log('Roshani Public School ERP — Test User Provisioning')
  console.log('============================================================')
  console.log(`Supabase URL: ${SUPABASE_URL}`)
  console.log(`School: ${SCHOOL_A_ID}`)
  console.log(`Password for all test users: ${TEST_PASSWORD}`)
  console.log('------------------------------------------------------------')
  console.log('')

  for (const testUser of TEST_USERS) {
    await createTestUser(testUser)
    console.log('')
  }

  console.log('============================================================')
  console.log('Provisioning complete!')
  console.log('')
  console.log('Test Credentials:')
  console.log('  Password: TestPass123!')
  console.log('')
  for (const u of TEST_USERS) {
    const roleStr = u.roles.length > 0 ? u.roles.join(', ') : 'unprovisioned'
    const statusStr = u.status !== 'active' ? ` [${u.status}]` : ''
    console.log(`  ${u.email.padEnd(35)} → ${roleStr}${statusStr}`)
  }
  console.log('============================================================')
}

main().catch(console.error)
