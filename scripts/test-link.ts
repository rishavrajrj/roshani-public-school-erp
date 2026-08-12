import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(url, key)

const USERS = [
  { email: 'superadmin@roshanischool.com', pass: 'TestPass123!' },
  { email: 'admin@roshanischool.com', pass: 'TestPass123!' },
  { email: 'principal@roshanischool.com', pass: 'TestPass123!' },
  { email: 'teacher@roshanischool.com', pass: 'TestPass123!' },
  { email: 'accountant@roshanischool.com', pass: 'TestPass123!' },
  { email: 'parent@roshanischool.com', pass: 'TestPass123!' },
  { email: 'student@roshanischool.com', pass: 'TestPass123!' },
  { email: 'unprovisioned@roshanischool.com', pass: 'TestPass123!' },
  { email: 'disabled@roshanischool.com', pass: 'TestPass123!' },
]

async function run() {
  for (const u of USERS) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.pass,
    })
    if (error) {
      console.log(`[FAIL] ${u.email}:`, error.message)
    } else {
      console.log(`[OK] ${u.email} -> auth_user_id: ${data.user.id}`)
    }
  }
}

run()
