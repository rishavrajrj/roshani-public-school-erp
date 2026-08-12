import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(url, key)

async function applyLink() {
  console.log('Fetching auth users...')
  const { data: users, error: usersErr } = await supabase.from('profiles').select('id, full_name, auth_user_id')
  console.log('Current profiles in DB:', users, usersErr)
}

applyLink()
