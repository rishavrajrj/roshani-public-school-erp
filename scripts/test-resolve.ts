import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(url, key)

async function testResolve() {
  const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'admin@roshanischool.com',
    password: 'TestPass123!',
  })

  if (loginErr || !authData.user) {
    console.error('Login error:', loginErr)
    return
  }

  console.log('User signed in:', authData.user.id)

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authData.user.id)
    .single()

  console.log('Profile:', profile, profileErr)

  if (profile) {
    const { data: roles, error: rolesErr } = await supabase
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('profile_id', profile.id)
      .eq('school_id', profile.school_id)

    console.log('User roles:', JSON.stringify(roles), rolesErr)
  }
}

testResolve()
