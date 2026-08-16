import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const [k, ...v] = trimmed.split('=')
  if (k && v.length > 0) process.env[k.trim()] = v.join('=').trim()
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkCols() {
  const tables = [
    'schools', 'academic_sessions', 'classes', 'sections', 'subjects',
    'profiles', 'guardians', 'students', 'admission_applications',
    'fee_structures', 'invoices', 'payments', 'receipts', 'refunds',
    'adjustments', 'student_credits', 'examinations', 'examination_schedules',
    'admit_cards', 'student_results', 'report_cards', 'certificates',
    'transport_routes', 'transport_stops', 'student_transport_allocations',
    'hostels', 'hostel_rooms', 'student_hostel_allocations',
    'library_books', 'library_members', 'library_issues',
    'inventory_items', 'inventory_purchases',
    'payroll_periods', 'staff_payslips',
    'school_houses', 'school_clubs', 'student_activity_memberships'
  ]
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1)
    if (error) {
      console.log(t, 'ERROR:', error.message)
    } else if (data && data.length > 0) {
      console.log(t, 'COLS:', Object.keys(data[0]).join(', '))
    } else {
      console.log(t, 'EMPTY')
    }
  }
}
checkCols()
