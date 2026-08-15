import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function testSingleJoinedQuery() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'admin@roshanischool.com',
    password: 'TestPass123!',
  })

  if (!authData.user) return

  const start = performance.now()
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      school_id,
      full_name,
      status,
      avatar_url,
      user_roles!user_roles_profile_id_fkey (
        role_id,
        roles (
          name
        )
      )
    `)
    .eq('auth_user_id', authData.user.id)
    .single()

  const duration = performance.now() - start
  console.log('Single joined query took:', duration.toFixed(1), 'ms')
  console.log('Data:', JSON.stringify(data, null, 2))
  console.log('Error:', error)
}

testSingleJoinedQuery().catch(console.error)
