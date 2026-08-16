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

async function main() {
  const { data: schools } = await supabase.from('schools').select('*')
  const { data: roles } = await supabase.from('roles').select('*')
  const { data: sessions } = await supabase.from('academic_sessions').select('*')
  const { data: exams } = await supabase.from('examinations').select('*')

  console.log('SCHOOLS:', schools)
  console.log('ROLES:', roles)
  console.log('SESSIONS:', sessions)
  console.log('EXAMINATIONS:', exams)
}

main().catch(console.error)
