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
  auth: { persistSession: false },
})

async function checkAdmitCardColumns() {
  console.log('Testing Admit Card V2 query against remote Supabase...')
  const { data, error } = await supabase
    .from('admit_cards')
    .select('id, school_id, academic_session_id, examination_id, student_id, admit_card_number, verification_token, status, financial_clearance_status, version, document_fingerprint, replacement_reason, superseded_at, superseded_by, data_snapshot')
    .limit(1)

  if (error) {
    console.error('❌ Error querying admit_cards columns:', error.message)
  } else {
    console.log('✅ SUCCESS: All Admit Card V2 columns exist and are queryable on remote Supabase!')
  }
}

checkAdmitCardColumns().catch(console.error)
