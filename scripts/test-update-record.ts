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

async function testUpdate() {
  // Test if student_code column exists
  const { data, error } = await supabase.from('students').update({
    admission_number: 'ADM-RPS-NOIDA-2026-000002'
  }).eq('id', 'f200bc99-0002-4ef8-bb6d-6bb9bd380a11').select()
  console.log('Update admission_number result:', data ? 'SUCCESS' : 'FAILED', error?.message)
}
testUpdate()
