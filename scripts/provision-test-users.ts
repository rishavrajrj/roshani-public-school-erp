import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(url, key)

const TEST_USERS = [
  { email: 'superadmin@roshanischool.com', name: 'Vijay Kumar (Super Admin)' },
  { email: 'admin@roshanischool.com', name: 'Priya Sharma (Admin)' },
  { email: 'principal@roshanischool.com', name: 'Dr. Ramesh Gupta (Principal)' },
  { email: 'teacher@roshanischool.com', name: 'Sunita Devi (Teacher)' },
  { email: 'accountant@roshanischool.com', name: 'Manoj Verma (Accountant)' },
  { email: 'parent@roshanischool.com', name: 'Rajesh Kumar (Parent)' },
  { email: 'student@roshanischool.com', name: 'Arjun Kumar (Student)' },
  { email: 'unprovisioned@roshanischool.com', name: 'Unprovisioned User' },
  { email: 'disabled@roshanischool.com', name: 'Disabled Account' },
]

async function provision() {
  console.log('Provisioning test auth users via GoTrue API...')

  for (const user of TEST_USERS) {
    console.log(`Creating ${user.email}...`)
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: 'TestPass123!',
      options: {
        data: { full_name: user.name }
      }
    })

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`  User ${user.email} already exists.`)
      } else {
        console.error(`  Error creating ${user.email}:`, error.message)
      }
    } else {
      console.log(`  Created ${user.email} -> ID: ${data.user?.id}`)
    }
  }
}

provision()
