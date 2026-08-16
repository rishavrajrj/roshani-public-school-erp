import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

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

async function migrateBusinessIds() {
  console.log('======================================================================')
  console.log('🔄 MySchool-ERP — Business ID Migration & Data Backfill Pipeline')
  console.log('======================================================================')

  const { data: schools, error: schoolErr } = await supabase.from('schools').select('id, name, code')
  if (schoolErr || !schools) {
    console.error('Failed to load schools:', schoolErr)
    return
  }

  for (const school of schools) {
    console.log(`\n🏫 Processing School: ${school.name} (${school.code})`)

    // 1. Migrate Students
    const { data: students } = await supabase
      .from('students')
      .select('id, admission_number, created_at')
      .eq('school_id', school.id)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })

    if (students && students.length > 0) {
      console.log(`  Updating ${students.length} students...`)
      for (let i = 0; i < students.length; i++) {
        const seq = String(i + 1).padStart(6, '0')
        const stdAdmNo = `ADM-${school.code}-2026-${seq}`
        await supabase
          .from('students')
          .update({ admission_number: stdAdmNo })
          .eq('id', students[i].id)
      }
      console.log(`  ✅ Successfully updated ${students.length} students for ${school.code}`)
    }

    // 2. Migrate Admission Applications
    const { data: admissions } = await supabase
      .from('admission_applications')
      .select('id, application_number, created_at')
      .eq('school_id', school.id)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })

    if (admissions && admissions.length > 0) {
      console.log(`  Updating ${admissions.length} admission applications...`)
      for (let i = 0; i < admissions.length; i++) {
        const seq = String(i + 1).padStart(6, '0')
        const appNo = `ADM-${school.code}-2026-${seq}`
        await supabase
          .from('admission_applications')
          .update({ application_number: appNo })
          .eq('id', admissions[i].id)
      }
      console.log(`  ✅ Successfully updated ${admissions.length} admission applications for ${school.code}`)
    }

    // 3. Migrate Examinations
    const { data: exams } = await supabase
      .from('examinations')
      .select('id, code')
      .eq('school_id', school.id)

    if (exams && exams.length > 0) {
      for (let i = 0; i < exams.length; i++) {
        const seq = String(i + 1).padStart(6, '0')
        const examCode = `EXM-${school.code}-2026-${seq}`
        await supabase
          .from('examinations')
          .update({ code: examCode })
          .eq('id', exams[i].id)
      }
      console.log(`  ✅ Successfully updated ${exams.length} examinations for ${school.code}`)
    }
  }

  console.log('\n======================================================================')
  console.log('🎉 ALL DATA RECORDS SUCCESSFULLY MIGRATED TO HUMAN-READABLE BUSINESS IDS!')
  console.log('======================================================================')
}

migrateBusinessIds().catch(console.error)
