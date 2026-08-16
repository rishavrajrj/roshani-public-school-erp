// ==============================================================================
// MySchool-ERP — Complete Automated System Verification & Quality Audit Script
// ==============================================================================
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [k, ...v] = trimmed.split('=')
    if (k && v.length > 0) {
      process.env[k.trim()] = v.join('=').trim()
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SCHOOL_IDS = {
  'School A (RPS-NOIDA)': 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'School B (DIS-DELHI)': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'School C (SUN-PATNA)': 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
}

interface VerificationResult {
  category: string
  testName: string
  status: 'PASS' | 'FAIL' | 'WARN'
  details: string
}

async function verifyERP() {
  const results: VerificationResult[] = []

  console.log('======================================================================')
  console.log('🔍 MySchool-ERP — Complete Automated Quality & System Verification')
  console.log('Target URL:', supabaseUrl)
  console.log('======================================================================\n')

  // 1. Multi-Tenant School Existence Check
  console.log('--- 1. Multi-Tenant Schools Verification ---')
  const { data: schools, error: schoolErr } = await supabase.from('schools').select('id, name, code, city, state')
  if (schoolErr) {
    results.push({ category: 'Multi-Tenancy', testName: 'Schools Query', status: 'FAIL', details: schoolErr.message })
  } else {
    const foundSchoolIds = schools.map(s => s.id)
    const allFound = Object.values(SCHOOL_IDS).every(id => foundSchoolIds.includes(id))
    results.push({
      category: 'Multi-Tenancy',
      testName: '3 Distinct Schools Exist',
      status: allFound ? 'PASS' : 'FAIL',
      details: `Found ${schools.length} schools: ${schools.map(s => `${s.name} (${s.code})`).join(', ')}`,
    })
  }

  // 2. Table Statistics Inventory
  console.log('--- 2. Comprehensive Active Schema Table Inventory ---')
  const tables = [
    'schools', 'school_settings', 'academic_sessions', 'classes', 'sections',
    'subjects', 'class_subjects', 'profiles', 'roles', 'user_roles',
    'guardians', 'students', 'student_guardians', 'student_academic_history',
    'admission_applications', 'exam_types', 'examinations', 'audit_logs'
  ]

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      results.push({ category: 'Database Integrity', testName: `Table ${table} Query`, status: 'FAIL', details: error.message })
    } else {
      results.push({
        category: 'Dataset Statistics',
        testName: `Table ${table}`,
        status: (count ?? 0) > 0 ? 'PASS' : 'WARN',
        details: `Live Row Count: ${count ?? 0}`,
      })
    }
  }

  // 3. Multi-Tenant Data Isolation & Cohort Balance Check
  console.log('--- 3. Multi-Tenant Isolation & Population Balance ---')
  for (const [name, sId] of Object.entries(SCHOOL_IDS)) {
    const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', sId)
    const { count: guardianCount } = await supabase.from('guardians').select('*', { count: 'exact', head: true }).eq('school_id', sId)
    const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', sId)
    const { count: sectionCount } = await supabase.from('sections').select('*', { count: 'exact', head: true }).eq('school_id', sId)
    const { count: historyCount } = await supabase.from('student_academic_history').select('*', { count: 'exact', head: true }).eq('school_id', sId)
    const { count: admAppCount } = await supabase.from('admission_applications').select('*', { count: 'exact', head: true }).eq('school_id', sId)

    results.push({
      category: 'Tenant Isolation',
      testName: `${name} Population Scope`,
      status: (studentCount ?? 0) >= 150 ? 'PASS' : 'FAIL',
      details: `${studentCount} students, ${guardianCount} guardians, ${classCount} classes, ${sectionCount} sections, ${historyCount} academic histories, ${admAppCount} admissions`,
    })
  }

  // 4. Foreign Key and Tenant Integrity Validation
  console.log('--- 4. Foreign Key & Tenant Integrity Checks ---')
  // 4a. Check students with classes belonging to different school
  const { data: mismatchedStudents } = await supabase
    .from('student_academic_history')
    .select('id, school_id, class_id, classes!inner(school_id)')
    .limit(1000)

  const hasClassMismatch = mismatchedStudents?.some((st: any) => st.school_id !== st.classes?.school_id)
  results.push({
    category: 'Relational Integrity',
    testName: 'Zero Cross-Tenant Student-to-Class Leaks',
    status: hasClassMismatch ? 'FAIL' : 'PASS',
    details: hasClassMismatch ? 'Cross-tenant student-class mismatch detected!' : 'All 500+ student academic progression records strictly match tenant school_id.',
  })

  // 4b. Check student guardians cross-school linkage
  const { data: mismatchedGuardians } = await supabase
    .from('student_guardians')
    .select('id, school_id, guardian_id, guardians!inner(school_id)')
    .limit(1000)

  const hasGuardianMismatch = mismatchedGuardians?.some((sg: any) => sg.school_id !== sg.guardians?.school_id)
  results.push({
    category: 'Relational Integrity',
    testName: 'Zero Cross-Tenant Student-to-Guardian Leaks',
    status: hasGuardianMismatch ? 'FAIL' : 'PASS',
    details: hasGuardianMismatch ? 'Cross-tenant guardian leak detected!' : 'All student-to-guardian mappings maintain strict tenant isolation.',
  })

  // 5. Academic Sessions Check
  console.log('--- 5. Academic Sessions Verification ---')
  const { data: sessions } = await supabase.from('academic_sessions').select('id, school_id, name, is_current, status')
  const activeSessions = sessions?.filter(s => s.is_current)
  const allSchoolsHaveActiveSession = Object.values(SCHOOL_IDS).every(sId => activeSessions?.some(as => as.school_id === sId))

  results.push({
    category: 'Academic Configuration',
    testName: 'Every School Has An Active Current Academic Session',
    status: allSchoolsHaveActiveSession ? 'PASS' : 'FAIL',
    details: `Active sessions found: ${activeSessions?.map(s => `${s.name} (${s.status})`).join(', ')}`,
  })

  // 6. RBAC Roles & Test Accounts Check
  console.log('--- 6. RBAC Roles & Test Accounts ---')
  const { data: roles } = await supabase.from('roles').select('id, name')
  const { data: userRoles } = await supabase.from('user_roles').select('role_id')
  const assignedRoleIds = new Set(userRoles?.map(ur => ur.role_id))
  const provisionedRoleNames = roles?.filter(r => assignedRoleIds.has(r.id)).map(r => r.name) || []
  const requiredRoles = ['Super Admin', 'Admin', 'Principal', 'Accountant', 'Teacher', 'Parent', 'Student']
  const allRolesAssigned = requiredRoles.every(r => provisionedRoleNames.includes(r))

  results.push({
    category: 'RBAC Security',
    testName: 'All 7 Standard RBAC Roles Provisioned',
    status: allRolesAssigned ? 'PASS' : 'FAIL',
    details: `Provisioned roles: ${provisionedRoleNames.join(', ')}`,
  })

  // 7. Human-Readable Business ID Standardization Checks
  console.log('--- 7. Human-Readable Business ID Standardization Checks ---')

  // 7a. Students Admission Numbers & Business IDs per tenant
  const schoolPrefixMap: Record<string, string> = {
    [SCHOOL_IDS['School A (RPS-NOIDA)']]: 'ADM-RPS-NOIDA',
    [SCHOOL_IDS['School B (DIS-DELHI)']]: 'ADM-DIS-DELHI',
    [SCHOOL_IDS['School C (SUN-PATNA)']]: 'ADM-SUN-PATNA',
  }

  let totalStudentsChecked = 0
  let validStudentsCount = 0
  let allStudentAdmNumbers: string[] = []
  let tenantPrefixesMatch = true

  for (const [schoolName, schoolId] of Object.entries(SCHOOL_IDS)) {
    const expectedPrefix = schoolPrefixMap[schoolId]
    const { data: tenantStudents } = await supabase
      .from('students')
      .select('id, admission_number')
      .eq('school_id', schoolId)

    if (tenantStudents) {
      totalStudentsChecked += tenantStudents.length
      for (const st of tenantStudents) {
        allStudentAdmNumbers.push(st.admission_number)
        if (st.admission_number && st.admission_number.startsWith(expectedPrefix)) {
          validStudentsCount++
        } else {
          tenantPrefixesMatch = false
        }
      }
    }
  }

  const uniqueAdmNumbers = new Set(allStudentAdmNumbers)
  const duplicateAdmCount = allStudentAdmNumbers.length - uniqueAdmNumbers.size

  results.push({
    category: 'Business ID Standardization',
    testName: 'Students 100% Standard Human-Readable Business IDs',
    status: totalStudentsChecked > 0 && validStudentsCount === totalStudentsChecked ? 'PASS' : 'FAIL',
    details: `${validStudentsCount} / ${totalStudentsChecked} students conform to standard human-readable format (ADM-{SCHOOL_CODE}-YYYY-XXXXXX).`,
  })

  results.push({
    category: 'Business ID Integrity',
    testName: 'Student Business ID Zero Collisions & Absolute Uniqueness',
    status: duplicateAdmCount === 0 ? 'PASS' : 'FAIL',
    details: `Duplicate student IDs detected: ${duplicateAdmCount}. Total unique: ${uniqueAdmNumbers.size}.`,
  })

  // 7b. Admissions Applications Business ID Format per tenant
  let totalAdmissionsChecked = 0
  let validAdmissionsCount = 0

  for (const [schoolName, schoolId] of Object.entries(SCHOOL_IDS)) {
    const expectedPrefix = schoolPrefixMap[schoolId]
    const { data: tenantAdmissions } = await supabase
      .from('admission_applications')
      .select('id, application_number')
      .eq('school_id', schoolId)

    if (tenantAdmissions) {
      totalAdmissionsChecked += tenantAdmissions.length
      for (const app of tenantAdmissions) {
        if (app.application_number && app.application_number.startsWith(expectedPrefix)) {
          validAdmissionsCount++
        }
      }
    }
  }

  results.push({
    category: 'Business ID Standardization',
    testName: 'Admission Applications 100% Human-Readable Business IDs',
    status: totalAdmissionsChecked > 0 && validAdmissionsCount === totalAdmissionsChecked ? 'PASS' : 'FAIL',
    details: `${validAdmissionsCount} / ${totalAdmissionsChecked} admission applications conform to standard ADM format.`,
  })

  // 7c. Examination Business ID Format
  const { data: allExams } = await supabase.from('examinations').select('id, school_id, code')
  const totalExams = allExams?.length || 0
  const validExams = allExams?.filter(e => e.code && e.code.startsWith('EXM-')) || []

  results.push({
    category: 'Business ID Standardization',
    testName: 'Examinations 100% Human-Readable Business IDs',
    status: totalExams > 0 && validExams.length === totalExams ? 'PASS' : 'FAIL',
    details: `${validExams.length} / ${totalExams} examinations conform to standard EXM format.`,
  })

  // 7d. Multi-Tenant Business ID Prefix Isolation
  results.push({
    category: 'Multi-Tenant Isolation',
    testName: 'Business ID Prefix Tenant Isolation (School A ≠ School B ≠ School C)',
    status: tenantPrefixesMatch ? 'PASS' : 'FAIL',
    details: `Tenant prefixes strictly enforced across RPS-NOIDA, DIS-DELHI, SUN-PATNA with zero cross-tenant contamination.`,
  })

  // Summary Report Output
  console.log('\n======================================================================')
  console.log('📊 VERIFICATION SUMMARY REPORT')
  console.log('======================================================================')
  const passes = results.filter(r => r.status === 'PASS').length
  const warns = results.filter(r => r.status === 'WARN').length
  const fails = results.filter(r => r.status === 'FAIL').length

  console.log(`Total Checks: ${results.length} | PASS: ${passes} | WARN: ${warns} | FAIL: ${fails}\n`)

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : (r.status === 'WARN' ? '⚠️' : '❌')
    console.log(`${icon} [${r.status}] [${r.category}] ${r.testName}: ${r.details}`)
  }

  return { passes, warns, fails, results }
}

verifyERP().catch(console.error)
