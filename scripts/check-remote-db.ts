import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually
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

async function checkRemote() {
  console.log('Connecting to:', supabaseUrl)

  const tablesToCheck = [
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
    'fee_categories',
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

  const results: Record<string, { exists: boolean; count?: number; error?: string }> = {}

  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (error) {
        results[table] = { exists: false, error: error.message }
      } else {
        results[table] = { exists: true, count: count ?? 0 }
      }
    } catch (e: any) {
      results[table] = { exists: false, error: e.message }
    }
  }

  console.log('Remote Database Inspection Results:')
  console.log(JSON.stringify(results, null, 2))
}

checkRemote().catch(console.error)
