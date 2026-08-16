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

async function testCols() {
  const { data: s, error: errS } = await supabase.from('students').select('id, admission_number').limit(1)
  console.log('Students select:', s, errS?.message)

  const { data: g, error: errG } = await supabase.from('guardians').select('id').limit(1)
  console.log('Guardians select:', g, errG?.message)

  const { data: p, error: errP } = await supabase.from('profiles').select('id').limit(1)
  console.log('Profiles select:', p, errP?.message)
}
testCols()
