import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(url, key)

async function linkProfiles() {
  console.log('Linking auth users to profiles...')
  // Sign in as admin to get access
  const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'admin@roshanischool.com',
    password: 'TestPass123!',
  })

  if (loginErr || !authData.user) {
    console.error('Failed to sign in as admin:', loginErr?.message)
    return
  }

  console.log('Successfully signed in as admin:', authData.user.id)
}

linkProfiles()
