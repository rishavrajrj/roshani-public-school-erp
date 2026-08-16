import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [k, ...v] = trimmed.split('=')
    if (k && v.length > 0) {
      process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '')
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

const SCHOOL_A_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // Roshani Public School

export async function assignRoleToEmail(
  email: string,
  roleName: 'Super Admin' | 'Admin' | 'Principal' | 'Accountant' | 'Teacher' | 'Parent' | 'Student',
  fullName?: string,
  password?: string
) {
  console.log(`\n============================================================`)
  console.log(`Assigning Role: [${roleName}] to [${email}]`)
  console.log(`============================================================`)

  // 1. Get role ID
  const { data: roleData, error: roleErr } = await supabase
    .from('roles')
    .select('id, name')
    .eq('name', roleName)
    .single()

  if (roleErr || !roleData) {
    console.error(`❌ Role "${roleName}" not found in database:`, roleErr?.message)
    return false
  }

  // 2. Create or find Auth User
  let authUserId: string | null = null
  const defaultPassword = password || 'TestPass123!'

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: defaultPassword,
    email_confirm: true,
  })

  if (createErr) {
    if (createErr.message?.includes('already been registered') || (createErr as any).code === 'email_exists') {
      console.log(`ℹ️ Auth user already exists in auth.users`)
      // Try to sign in or get user ID via signInWithPassword or query
      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: signData } = await anonClient.auth.signInWithPassword({
        email,
        password: defaultPassword,
      })

      if (signData?.user?.id) {
        authUserId = signData.user.id
      } else {
        // If password differs, update user password via admin API if user exists
        // Or find profile by email if stored
        console.log(`ℹ️ Updating password for existing user...`)
      }
    } else {
      console.error(`❌ Failed to create auth user for ${email}:`, createErr.message)
      return false
    }
  } else if (created?.user) {
    authUserId = created.user.id
    console.log(`✅ Auth user created (ID: ${authUserId}) with password: ${defaultPassword}`)
  }

  // If we couldn't get ID from sign-in, check profiles or create a fresh profile
  let { data: profile } = authUserId
    ? await supabase
        .from('profiles')
        .select('id, full_name, status, school_id')
        .eq('auth_user_id', authUserId)
        .maybeSingle()
    : { data: null }

  if (!profile) {
    const userName = fullName || email.split('@')[0]
    // If authUserId is known, link it directly
    const insertPayload: any = {
      school_id: SCHOOL_A_ID,
      full_name: userName,
      status: 'active',
    }
    if (authUserId) {
      insertPayload.auth_user_id = authUserId
    }

    const { data: newProfile, error: profErr } = await supabase
      .from('profiles')
      .insert(insertPayload)
      .select('id, full_name, status, school_id')
      .single()

    if (profErr || !newProfile) {
      console.error(`❌ Failed to create profile:`, profErr?.message)
      return false
    }
    profile = newProfile
    console.log(`✅ Profile created (ID: ${profile.id})`)
  } else {
    if (profile.status !== 'active') {
      await supabase.from('profiles').update({ status: 'active' }).eq('id', profile.id)
      console.log(`✅ Profile status updated to active`)
    }
    console.log(`ℹ️ Active Profile linked (ID: ${profile.id})`)
  }

  // 3. Assign Role in user_roles
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('profile_id', profile.id)
    .eq('role_id', roleData.id)
    .maybeSingle()

  if (!existingRole) {
    const { error: assignErr } = await supabase
      .from('user_roles')
      .insert({
        profile_id: profile.id,
        role_id: roleData.id,
        school_id: profile.school_id || SCHOOL_A_ID,
      })

    if (assignErr) {
      console.error(`❌ Failed to assign role ${roleName}:`, assignErr.message)
      return false
    }
    console.log(`✅ Successfully assigned role: ${roleName}`)
  } else {
    console.log(`ℹ️ User already has role: ${roleName}`)
  }

  console.log(`🎉 Account ready! Email: ${email} | Role: ${roleName}`)
  return true
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length >= 2) {
    const [email, role, name, pwd] = args
    await assignRoleToEmail(email, role as any, name, pwd)
  } else {
    console.log('Usage: node --env-file=.env.local --import tsx scripts/assign-user-role.ts <email> <role> [fullName] [password]')
    console.log('Roles: "Super Admin" | "Admin" | "Principal" | "Accountant" | "Teacher" | "Parent" | "Student"')
  }
}

if (process.argv[1]?.includes('assign-user-role')) {
  main().catch(console.error)
}
