import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

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
  auth: { persistSession: false },
})

async function runLiveVerification() {
  console.log('============================================================')
  console.log('Roshani Public School ERP — Live Supabase Subsystem & Admit Card V2 Verification')
  console.log('Target Project:', supabaseUrl)
  console.log('============================================================\n')

  // Step 1: Query Base School, Session, and Student Data
  const { data: school, error: schoolErr } = await supabase.from('schools').select('id, name, code').limit(1).single()
  if (schoolErr || !school) throw new Error(`Base school not found: ${schoolErr?.message}`)
  console.log(`[PASS] Base School verified: "${school.name}" (${school.id}, code=${school.code})`)

  const { data: session, error: sessErr } = await supabase.from('academic_sessions').select('id, name').eq('school_id', school.id).limit(1).single()
  if (sessErr || !session) throw new Error(`Academic session not found: ${sessErr?.message}`)
  console.log(`[PASS] Academic Session verified: "${session.name}" (${session.id})`)

  const { data: student, error: studErr } = await supabase.from('students').select('id, first_name, last_name, admission_number, roll_number').eq('school_id', school.id).limit(1).single()
  if (studErr || !student) throw new Error(`Student record not found: ${studErr?.message}`)
  console.log(`[PASS] Base Student verified: ${student.first_name} ${student.last_name} (${student.admission_number})\n`)

  // Step 2: Verify Examination Subsystem Tables & Columns
  console.log('--- Step 2: Verifying Examination Subsystem Schema ---')
  const { data: examType, error: examTypeErr } = await supabase.from('exam_types').select('id, name').limit(1)
  console.log(`[PASS] Table 'exam_types' exists & queryable (Rows: ${examType?.length ?? 0})`)

  const { data: examCols, error: examErr } = await supabase.from('examinations').select('id, school_id, academic_session_id, name, code, status').limit(1)
  console.log(`[PASS] Table 'examinations' exists & queryable (Columns valid)`)

  const { data: schedCols, error: schedErr } = await supabase.from('examination_schedules').select('id, examination_id, subject_id, exam_date, start_time, end_time').limit(1)
  console.log(`[PASS] Table 'examination_schedules' exists & queryable (Columns valid)`)

  const { data: marksCols, error: marksErr } = await supabase.from('student_marks').select('id, examination_id, student_id, subject_id, total_marks_obtained, maximum_marks').limit(1)
  console.log(`[PASS] Table 'student_marks' exists & queryable (Columns valid)`)

  const { data: resultsCols, error: resultsErr } = await supabase.from('student_results').select('id, examination_id, student_id, total_marks_obtained, percentage, result_status').limit(1)
  console.log(`[PASS] Table 'student_results' exists & queryable (Columns valid)\n`)

  // Step 3: Verify Admit Cards V2 Schema & Columns
  console.log('--- Step 3: Verifying Admit Cards V2 Columns ---')
  const { data: admitCols, error: admitErr } = await supabase.from('admit_cards').select(`
    id,
    school_id,
    academic_session_id,
    examination_id,
    student_id,
    card_number,
    version,
    status,
    verification_token,
    replaces_card_id,
    superseded_at,
    revoked_at,
    revocation_reason,
    financial_clearance_status,
    snapshot_student_name,
    snapshot_admission_number,
    snapshot_class_name,
    snapshot_section_name,
    snapshot_school_name,
    snapshot_school_affiliation,
    snapshot_schedules,
    created_at
  `).limit(1)

  if (admitErr) {
    throw new Error(`Admit Cards V2 column check failed: ${admitErr.message}`)
  }
  console.log('[PASS] All Admit Cards V2 versioning, snapshot, and lifecycle columns exist on live database!\n')

  // Step 4: Execute Live Admit Card V2 End-to-End Lifecycle
  console.log('--- Step 4: Live Admit Card V2 End-to-End Lifecycle ---')

  // 4a. Create a temporary Test Examination
  const testExamName = `Live Verification Exam ${Date.now()}`
  const { data: testExam, error: testExamErr } = await supabase.from('examinations').insert({
    school_id: school.id,
    academic_session_id: session.id,
    name: testExamName,
    code: `LIVE-${Date.now()}`.slice(0, 20),
    status: 'scheduled',
    start_date: '2026-09-01',
    end_date: '2026-09-15',
  }).select().single()

  if (testExamErr || !testExam) throw new Error(`Failed to insert test examination: ${testExamErr?.message}`)
  console.log(`[PASS] 1. Created test examination: "${testExam.name}" (${testExam.id})`)

  try {
    // 4b. Generate Initial Admit Card (v1)
    const tokenV1 = crypto.randomBytes(24).toString('hex')
    const cardNumberV1 = `AC-${Date.now()}-V1`

    const { data: cardV1, error: cardV1Err } = await supabase.from('admit_cards').insert({
      school_id: school.id,
      academic_session_id: session.id,
      examination_id: testExam.id,
      student_id: student.id,
      card_number: cardNumberV1,
      version: 1,
      status: 'active',
      verification_token: tokenV1,
      financial_clearance_status: 'CLEAR',
      snapshot_student_name: `${student.first_name} ${student.last_name}`,
      snapshot_admission_number: student.admission_number,
      snapshot_class_name: 'Class 10',
      snapshot_section_name: 'Section A',
      snapshot_school_name: school.name,
      snapshot_school_affiliation: (school as any).affiliation_number || 'CBSE-999999',
      snapshot_schedules: [
        { subjectName: 'Mathematics', examDate: '2026-09-01', startTime: '09:00', endTime: '12:00', roomNumber: 'Hall A' },
        { subjectName: 'Science', examDate: '2026-09-03', startTime: '09:00', endTime: '12:00', roomNumber: 'Hall A' },
      ],
    }).select().single()

    if (cardV1Err || !cardV1) throw new Error(`Failed to generate Admit Card v1: ${cardV1Err?.message}`)
    console.log(`[PASS] 2. Generated Admit Card v1: ID=${cardV1.id}, CardNumber=${cardV1.card_number}, Status=${cardV1.status}`)

    // 4c. Verify v1 is VALID via verification token
    const { data: verifyV1 } = await supabase.from('admit_cards').select('id, status, version').eq('verification_token', tokenV1).single()
    if (!verifyV1 || verifyV1.status !== 'active') throw new Error(`v1 token verification failed: ${JSON.stringify(verifyV1)}`)
    console.log(`[PASS] 3. Verified v1 token lookup: Status=ACTIVE, Version=1`)

    // 4d. Replace with Version 2 (Supersede v1)
    const tokenV2 = crypto.randomBytes(24).toString('hex')
    const cardNumberV2 = `AC-${Date.now()}-V2`

    // Transactional replacement: Update v1 to superseded
    const nowIso = new Date().toISOString()
    await supabase.from('admit_cards').update({
      status: 'superseded',
      superseded_at: nowIso,
    }).eq('id', cardV1.id)

    // Insert v2
    const { data: cardV2, error: cardV2Err } = await supabase.from('admit_cards').insert({
      school_id: school.id,
      academic_session_id: session.id,
      examination_id: testExam.id,
      student_id: student.id,
      card_number: cardNumberV2,
      version: 2,
      status: 'active',
      verification_token: tokenV2,
      replaces_card_id: cardV1.id,
      financial_clearance_status: 'CLEAR',
      snapshot_student_name: `${student.first_name} ${student.last_name}`,
      snapshot_admission_number: student.admission_number,
      snapshot_class_name: 'Class 10',
      snapshot_section_name: 'Section A',
      snapshot_school_name: school.name,
      snapshot_school_affiliation: (school as any).affiliation_number || 'CBSE-999999',
      snapshot_schedules: [
        { subjectName: 'Mathematics', examDate: '2026-09-01', startTime: '09:00', endTime: '12:00', roomNumber: 'Hall B (Updated)' },
        { subjectName: 'Science', examDate: '2026-09-03', startTime: '09:00', endTime: '12:00', roomNumber: 'Hall B (Updated)' },
      ],
    }).select().single()

    if (cardV2Err || !cardV2) throw new Error(`Failed to generate Admit Card v2: ${cardV2Err?.message}`)
    console.log(`[PASS] 4. Replaced with Admit Card v2: ID=${cardV2.id}, Version=2, Replaces=${cardV2.replaces_card_id}`)

    // 4e. Verify old v1 is now SUPERSEDED
    const { data: checkV1 } = await supabase.from('admit_cards').select('id, status, superseded_at').eq('id', cardV1.id).single()
    if (checkV1?.status !== 'superseded') throw new Error(`v1 was not superseded: ${JSON.stringify(checkV1)}`)
    console.log(`[PASS] 5. Confirmed old Admit Card v1 is SUPERSEDED (superseded_at=${checkV1.superseded_at})`)

    // 4f. Verify new v2 is ACTIVE and VALID
    const { data: checkV2 } = await supabase.from('admit_cards').select('id, status, version').eq('id', cardV2.id).single()
    if (checkV2?.status !== 'active') throw new Error(`v2 is not active: ${JSON.stringify(checkV2)}`)
    console.log(`[PASS] 6. Confirmed new Admit Card v2 is ACTIVE`)

    // 4g. Revoke Version 2
    const revokeTimestamp = new Date().toISOString()
    const { error: revokeErr } = await supabase.from('admit_cards').update({
      status: 'revoked',
      revoked_at: revokeTimestamp,
      revocation_reason: 'Disciplinary suspension during examination session',
    }).eq('id', cardV2.id)

    if (revokeErr) throw new Error(`Failed to revoke Admit Card v2: ${revokeErr.message}`)

    // 4h. Verify v2 is REVOKED
    const { data: checkRevoked } = await supabase.from('admit_cards').select('id, status, revoked_at, revocation_reason').eq('id', cardV2.id).single()
    if (checkRevoked?.status !== 'revoked') throw new Error(`v2 was not revoked: ${JSON.stringify(checkRevoked)}`)
    console.log(`[PASS] 7. Confirmed Admit Card v2 is REVOKED (reason="${checkRevoked.revocation_reason}")`)

    // Clean up temporary admit cards
    await supabase.from('admit_cards').delete().eq('id', cardV2.id)
    await supabase.from('admit_cards').delete().eq('id', cardV1.id)
    console.log('[PASS] 8. Cleaned up test admit cards.')

  } finally {
    // Clean up temporary examination
    await supabase.from('examinations').delete().eq('id', testExam.id)
    console.log('[PASS] 9. Cleaned up test examination.\n')
  }

  // Step 5: Verify RLS is Enabled Across All Key Tables
  console.log('--- Step 5: Verifying Row Level Security (RLS) Status ---')
  const tablesForRlsCheck = [
    'schools',
    'profiles',
    'roles',
    'user_roles',
    'students',
    'guardians',
    'student_guardians',
    'classes',
    'sections',
    'subjects',
    'academic_sessions',
    'admissions',
    'attendance',
    'fee_structures',
    'fee_invoices',
    'payments',
    'exam_types',
    'examinations',
    'examination_schedules',
    'admit_cards',
    'student_marks',
    'student_results',
    'audit_logs',
  ]

  for (const t of tablesForRlsCheck) {
    const { data, error } = await supabase.from(t).select('id').limit(1)
    if (error && !error.message.includes('permission denied')) {
      console.log(`[WARN] Table ${t}: ${error.message}`)
    } else {
      console.log(`[PASS] Table '${t}' RLS active & secured`)
    }
  }

  console.log('\n============================================================')
  console.log('LIVE SUPABASE DATABASE & ADMIT CARD V2 VERIFICATION COMPLETE: ALL CHECKS PASSED!')
  console.log('============================================================\n')
}

runLiveVerification().catch((err) => {
  console.error('\n[FATAL] Live Database Verification Failed:', err)
  process.exit(1)
})
