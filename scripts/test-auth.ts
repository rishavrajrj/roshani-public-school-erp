import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(url, key)

async function testSignIn() {
  const email = 'admin@roshanischool.com'
  console.log('Testing signInWithPassword for admin@roshanischool.com...')

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'TestPass123!',
  })

  if (error) {
    console.error('SIGNIN FAILED:', error)
  } else {
    console.log('SIGNIN SUCCESS! User ID:', data.user.id)
  }
}

testSignIn()
