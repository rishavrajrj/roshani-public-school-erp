// ==============================================================================
// Roshani Public School ERP — Complete Demo Data Seeder (CBSE 2026-27)
// ==============================================================================
import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'

// Load environment variables from .env.local
try {
  if (typeof (process as any).loadEnvFile === 'function') {
    (process as any).loadEnvFile('.env.local')
  } else if (fs.existsSync('.env.local')) {
    const envConfig = fs.readFileSync('.env.local', 'utf-8')
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const val = match[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) process.env[key] = val
      }
    })
  }
} catch (e) {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Safe helper to run upserts or inserts in chunks
async function safeUpsert(table: string, records: any[], onConflict?: string) {
  const CHUNK_SIZE = 100
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE)
    const query = supabase.from(table).upsert(chunk, onConflict ? { onConflict } : undefined)
    const { error } = await query
    if (error) {
      console.warn(`   ⚠️ [${table}] upsert warning:`, error.message)
    }
  }
}

// Fixed Deterministic School & Session IDs
const SCHOOL_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const SESSION_ID = 'b0eebc99-0001-4ef8-bb6d-6bb9bd380a11'

// Fixed Role IDs
const ROLES = {
  'Super Admin': 'd100bc99-0001-4ef8-bb6d-6bb9bd380a11',
  'Admin': 'd100bc99-0002-4ef8-bb6d-6bb9bd380a11',
  'Principal': 'd100bc99-0003-4ef8-bb6d-6bb9bd380a11',
  'Accountant': 'd100bc99-0004-4ef8-bb6d-6bb9bd380a11',
  'Teacher': 'd100bc99-0005-4ef8-bb6d-6bb9bd380a11',
  'Parent': 'd100bc99-0006-4ef8-bb6d-6bb9bd380a11',
  'Student': 'd100bc99-0007-4ef8-bb6d-6bb9bd380a11',
}

// Indian Name Datasets for Realistic Synthesis
const FIRST_NAMES_MALE = [
  'Arjun', 'Aarav', 'Rohan', 'Vivaan', 'Aditya', 'Kabir', 'Ishaan', 'Dev', 'Samar', 'Aryan',
  'Kunal', 'Manish', 'Harsh', 'Varun', 'Pranav', 'Yash', 'Siddharth', 'Nikhil', 'Gaurav', 'Ankit',
  'Tariq', 'Farhan', 'Joseph', 'Gurpreet', 'Manpreet', 'Harpreet', 'Kartik', 'Ayush', 'Rishi', 'Mayank'
]

const FIRST_NAMES_FEMALE = [
  'Ananya', 'Pooja', 'Sunita', 'Meera', 'Priya', 'Diya', 'Tanvi', 'Rhea', 'Sneha', 'Isha',
  'Neha', 'Kavita', 'Shreya', 'Anushka', 'Divya', 'Sanya', 'Aditi', 'Ritu', 'Simran', 'Fatima',
  'Zoya', 'Grace', 'Jaspreet', 'Navneet', 'Deepika', 'Kritika', 'Swati', 'Monika', 'Bhavna', 'Rashmi'
]

const LAST_NAMES = [
  'Kumar', 'Sharma', 'Mehta', 'Singh', 'Gupta', 'Verma', 'Patel', 'Reddy', 'Chauhan', 'Mishra',
  'Joshi', 'Bhatia', 'Nair', 'Sen', 'Roy', 'Malhotra', 'Khan', 'Ahmed', 'Fernandes', 'D\'Souza',
  'Kaur', 'Saxena', 'Rawat', 'Aggarwal', 'Tripathi', 'Pandey', 'Chhabra', 'Gill', 'Bajaj', 'Kapoor'
]

const HOUSES = ['Tagore (Red)', 'Ashoka (Blue)', 'Raman (Green)', 'Shivaji (Yellow)']
const BLOOD_GROUPS = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-']

async function seed() {
  console.log('======================================================================')
  console.log('🏫 Roshani Public School ERP — Demo Data Seeder (CBSE 2026-27)')
  console.log('======================================================================')

  // -------------------------------------------------------------------------
  // 1. SCHOOL & SETTINGS
  // -------------------------------------------------------------------------
  console.log('📍 1. Seeding School Master Data...')
  await safeUpsert('schools', [{
    id: SCHOOL_ID,
    name: 'Roshani Public School',
    code: 'RPS-NOIDA',
    address: 'Plot 12-15, Institutional Area, Knowledge Park III, Sector 62',
    city: 'Noida',
    state: 'Uttar Pradesh',
    country: 'India',
    phone: '+91 120 458 9200',
    email: 'contact@roshanischool.com',
    website: 'https://roshanischool.com',
    logo_url: '/images/rps-logo.png',
  }], 'id')

  // -------------------------------------------------------------------------
  // 2. ACADEMIC SESSIONS
  // -------------------------------------------------------------------------
  console.log('📅 2. Seeding Academic Session (2026-27)...')
  const { data: existingSession } = await supabase
    .from('academic_sessions')
    .select('id')
    .eq('school_id', SCHOOL_ID)
    .eq('is_current', true)
    .single()

  const activeSessionId = existingSession?.id || SESSION_ID

  if (!existingSession) {
    await safeUpsert('academic_sessions', [{
      id: SESSION_ID,
      school_id: SCHOOL_ID,
      name: '2026-2027',
      start_date: '2026-04-01',
      end_date: '2027-03-31',
      is_current: true,
      status: 'active',
    }], 'id')
  }

  // -------------------------------------------------------------------------
  // 3. CLASSES & SECTIONS
  // -------------------------------------------------------------------------
  console.log('🏛️ 3. Querying Existing Classes and Sections...')
  const { data: dbClasses } = await supabase.from('classes').select('id, name, display_order').eq('school_id', SCHOOL_ID)
  const { data: dbSections } = await supabase.from('sections').select('id, name, class_id').eq('school_id', SCHOOL_ID)

  const classMap: Record<string, string> = {}
  const sectionMap: Record<string, string> = {}

  if (dbClasses) {
    dbClasses.forEach(c => { classMap[c.name] = c.id })
  }
  if (dbSections && dbClasses) {
    dbSections.forEach(s => {
      const parentClass = dbClasses.find(c => c.id === s.class_id)
      if (parentClass) {
        sectionMap[`${parentClass.name}-${s.name}`] = s.id
      }
    })
  }

  // -------------------------------------------------------------------------
  // 4. SUBJECT MASTER DATA
  // -------------------------------------------------------------------------
  console.log('📚 4. Seeding CBSE Subjects...')
  const subjectList = [
    { code: 'ENG', name: 'English Core', order: 1 },
    { code: 'HIN', name: 'Hindi Course A', order: 2 },
    { code: 'MATH', name: 'Mathematics', order: 3 },
    { code: 'SCI', name: 'Science', order: 4 },
    { code: 'SST', name: 'Social Science', order: 5 },
    { code: 'CS', name: 'Computer Science', order: 6 },
    { code: 'AI', name: 'Artificial Intelligence', order: 7 },
    { code: 'SKT', name: 'Sanskrit', order: 8 },
    { code: 'GK', name: 'General Knowledge', order: 9 },
    { code: 'PE', name: 'Physical Education', order: 10 },
    { code: 'PHY', name: 'Physics', order: 11 },
    { code: 'CHEM', name: 'Chemistry', order: 12 },
    { code: 'BIO', name: 'Biology', order: 13 },
    { code: 'ACC', name: 'Accountancy', order: 14 },
    { code: 'BST', name: 'Business Studies', order: 15 },
    { code: 'ECO', name: 'Economics', order: 16 },
  ]

  const subjectRows = subjectList.map((s, idx) => ({
    id: `00000000-0000-4000-a000-${String(idx + 1).padStart(12, '0')}`,
    school_id: SCHOOL_ID,
    code: s.code,
    name: s.name,
    display_order: s.order,
    status: 'active',
  }))

  await safeUpsert('subjects', subjectRows, 'school_id,code')

  // -------------------------------------------------------------------------
  // 5. GUARDIANS (including Multi-child demo)
  // -------------------------------------------------------------------------
  console.log('👨‍👩‍👧 5. Seeding Guardians...')
  const GUARDIAN_RAJESH_ID = 'f100bc99-0001-4ef8-bb6d-6bb9bd380a11'
  const GUARDIAN_VIKRAM_ID = 'f100bc99-0002-4ef8-bb6d-6bb9bd380a11'
  const GUARDIAN_SUNITA_ID = 'f100bc99-0003-4ef8-bb6d-6bb9bd380a11'
  const GUARDIAN_HARISH_ID = 'f100bc99-0004-4ef8-bb6d-6bb9bd380a11'
  const PARENT_PROFILE_ID = 'e1000001-0006-4ef8-bb6d-6bb9bd380a11'

  const guardianRows = [
    {
      id: GUARDIAN_RAJESH_ID,
      school_id: SCHOOL_ID,
      profile_id: PARENT_PROFILE_ID,
      full_name: 'Rajesh Kumar',
      relationship: 'Father',
      phone: '+91 98101 23456',
      email: 'parent@roshanischool.com',
      occupation: 'Senior Software Architect',
      address: 'Tower 4, Flat 1202, Express Green Apartments, Sector 44, Noida, UP 201301',
      status: 'active',
    },
    {
      id: GUARDIAN_VIKRAM_ID,
      school_id: SCHOOL_ID,
      full_name: 'Vikram Sharma',
      relationship: 'Father',
      phone: '+91 98112 34567',
      email: 'vikram.sharma@example.com',
      occupation: 'Chartered Accountant',
      address: 'B-142, Sector 50, Noida, UP 201301',
      status: 'active',
    },
    {
      id: GUARDIAN_SUNITA_ID,
      school_id: SCHOOL_ID,
      full_name: 'Sunita Mehta',
      relationship: 'Mother',
      phone: '+91 98123 45678',
      email: 'sunita.mehta@example.com',
      occupation: 'Associate Professor',
      address: 'C-89, Sector 61, Noida, UP 201301',
      status: 'active',
    },
    {
      id: GUARDIAN_HARISH_ID,
      school_id: SCHOOL_ID,
      full_name: 'Harish Singh',
      relationship: 'Father',
      phone: '+91 98134 56789',
      email: 'harish.singh@example.com',
      occupation: 'Business Owner',
      address: 'D-55, Sector 12, Noida, UP 201301',
      status: 'active',
    },
  ]

  // Create additional realistic guardians for the student pool
  for (let i = 5; i <= 60; i++) {
    const isMale = i % 3 !== 0
    const fName = isMale ? FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length]
    const lName = LAST_NAMES[i % LAST_NAMES.length]
    guardianRows.push({
      id: `00000000-0000-4000-b000-${String(i).padStart(12, '0')}`,
      school_id: SCHOOL_ID,
      full_name: `${fName} ${lName}`,
      relationship: isMale ? 'Father' : 'Mother',
      phone: `+91 98${String(10000000 + i * 137).slice(0, 8)}`,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.com`,
      occupation: ['Executive', 'Manager', 'Teacher', 'Engineer', 'Consultant', 'Doctor'][i % 6],
      address: `House ${i * 7}, Sector ${20 + (i % 40)}, Noida, UP 201301`,
      status: 'active',
    })
  }

  await safeUpsert('guardians', guardianRows, 'id')

  // -------------------------------------------------------------------------
  // 6. STUDENTS & STUDENT-GUARDIAN RELATIONSHIPS
  // -------------------------------------------------------------------------
  console.log('🎒 6. Seeding 350+ Students across all classes & sections...')
  
  const STUDENT_ARJUN_ID = 'f200bc99-0001-4ef8-bb6d-6bb9bd380a11'
  const STUDENT_AARAV_ID = 'f200bc99-0002-4ef8-bb6d-6bb9bd380a11'
  const STUDENT_ANANYA_ID = 'f200bc99-0003-4ef8-bb6d-6bb9bd380a11'
  const STUDENT_ROHAN_ID = 'f200bc99-0004-4ef8-bb6d-6bb9bd380a11'
  const STUDENT_POOJA_ID = 'f200bc99-0005-4ef8-bb6d-6bb9bd380a11'
  const STUDENT_PROFILE_ID = 'e1000001-0007-4ef8-bb6d-6bb9bd380a11'

  const studentRows: any[] = [
    {
      id: STUDENT_ARJUN_ID,
      school_id: SCHOOL_ID,
      profile_id: STUDENT_PROFILE_ID,
      admission_number: 'RPS-2026-0101',
      roll_number: '101',
      first_name: 'Arjun',
      last_name: 'Kumar',
      date_of_birth: '2010-08-15',
      gender: 'male',
      status: 'active',
      address: 'Tower 4, Flat 1202, Express Green Apartments, Sector 44',
      city: 'Noida',
      state: 'Uttar Pradesh',
    },
    {
      id: STUDENT_AARAV_ID, // Sibling of Arjun Kumar
      school_id: SCHOOL_ID,
      admission_number: 'RPS-2026-0205',
      roll_number: '105',
      first_name: 'Aarav',
      last_name: 'Kumar',
      date_of_birth: '2014-11-20',
      gender: 'male',
      status: 'active',
      address: 'Tower 4, Flat 1202, Express Green Apartments, Sector 44',
      city: 'Noida',
      state: 'Uttar Pradesh',
    },
    {
      id: STUDENT_ANANYA_ID,
      school_id: SCHOOL_ID,
      admission_number: 'RPS-2026-0102',
      roll_number: '102',
      first_name: 'Ananya',
      last_name: 'Sharma',
      date_of_birth: '2010-05-12',
      gender: 'female',
      status: 'active',
      address: 'B-142, Sector 50',
      city: 'Noida',
      state: 'Uttar Pradesh',
    },
    {
      id: STUDENT_ROHAN_ID,
      school_id: SCHOOL_ID,
      admission_number: 'RPS-2026-0205B',
      roll_number: '205',
      first_name: 'Rohan',
      last_name: 'Mehta',
      date_of_birth: '2011-09-24',
      gender: 'male',
      status: 'active',
      address: 'C-89, Sector 61',
      city: 'Noida',
      state: 'Uttar Pradesh',
    },
    {
      id: STUDENT_POOJA_ID,
      school_id: SCHOOL_ID,
      admission_number: 'RPS-2026-0112',
      roll_number: '112',
      first_name: 'Pooja',
      last_name: 'Singh',
      date_of_birth: '2012-03-18',
      gender: 'female',
      status: 'active',
      address: 'D-55, Sector 12',
      city: 'Noida',
      state: 'Uttar Pradesh',
    },
  ]

  const studentGuardianRows: any[] = [
    { id: '00000000-0000-4000-c000-000000000001', school_id: SCHOOL_ID, student_id: STUDENT_ARJUN_ID, guardian_id: GUARDIAN_RAJESH_ID, relationship: 'Father', is_primary: true },
    { id: '00000000-0000-4000-c000-000000000002', school_id: SCHOOL_ID, student_id: STUDENT_AARAV_ID, guardian_id: GUARDIAN_RAJESH_ID, relationship: 'Father', is_primary: true }, // Multi-child Sibling!
    { id: '00000000-0000-4000-c000-000000000003', school_id: SCHOOL_ID, student_id: STUDENT_ANANYA_ID, guardian_id: GUARDIAN_VIKRAM_ID, relationship: 'Father', is_primary: true },
    { id: '00000000-0000-4000-c000-000000000004', school_id: SCHOOL_ID, student_id: STUDENT_ROHAN_ID, guardian_id: GUARDIAN_SUNITA_ID, relationship: 'Mother', is_primary: true },
    { id: '00000000-0000-4000-c000-000000000005', school_id: SCHOOL_ID, student_id: STUDENT_POOJA_ID, guardian_id: GUARDIAN_HARISH_ID, relationship: 'Father', is_primary: true },
  ]

  // Generate population across all sections
  let studentCounter = 6
  for (let cIdx = 1; cIdx <= 12; cIdx++) {
    const secLetters = ['A', 'B']
    for (const secLetter of secLetters) {
      const count = 14 + (studentCounter % 4)
      
      for (let sIdx = 1; sIdx <= count; sIdx++) {
        const isMale = (studentCounter + sIdx) % 2 === 0
        const fName = isMale ? FIRST_NAMES_MALE[(studentCounter + sIdx) % FIRST_NAMES_MALE.length] : FIRST_NAMES_FEMALE[(studentCounter + sIdx) % FIRST_NAMES_FEMALE.length]
        const lName = LAST_NAMES[(studentCounter * 3 + sIdx) % LAST_NAMES.length]
        const stId = `00000000-0000-4000-d000-${String(studentCounter).padStart(12, '0')}`
        const admNo = `RPS-2026-${String(studentCounter).padStart(4, '0')}`
        const rollNo = String(sIdx + 10)
        const gIdx = (studentCounter % 55) + 5
        const gId = `00000000-0000-4000-b000-${String(gIdx).padStart(12, '0')}`

        studentRows.push({
          id: stId,
          school_id: SCHOOL_ID,
          admission_number: admNo,
          roll_number: rollNo,
          first_name: fName,
          last_name: lName,
          date_of_birth: `201${1 + (cIdx % 5)}-0${(sIdx % 9) + 1}-15`,
          gender: isMale ? 'male' : 'female',
          status: 'active',
          address: `Sector ${20 + (sIdx % 40)}, House ${sIdx * 3}`,
          city: 'Noida',
          state: 'Uttar Pradesh',
        })

        studentGuardianRows.push({
          id: `00000000-0000-4000-c000-${String(studentCounter).padStart(12, '0')}`,
          school_id: SCHOOL_ID,
          student_id: stId,
          guardian_id: gId,
          relationship: isMale ? 'Father' : 'Mother',
          is_primary: true,
        })

        studentCounter++
      }
    }
  }

  await safeUpsert('students', studentRows, 'school_id,admission_number')
  await safeUpsert('student_guardians', studentGuardianRows, 'student_id,guardian_id')
  console.log(`   ✅ Seeded ${studentRows.length} students & guardian associations.`)

  // -------------------------------------------------------------------------
  // 7. ADMISSIONS PIPELINE (Live interactive demonstration)
  // -------------------------------------------------------------------------
  console.log('📝 7. Seeding Admissions Pipeline (20 applications)...')
  const sampleClassId = Object.values(classMap)[0] || 'c1000000-0001-4ef8-bb6d-6bb9bd380a11'
  const admissionApps = [
    {
      app_no: 'ADM-2026-0001',
      name: 'Aarav Gupta',
      status: 'under_review', // READY FOR DEMO TO APPROVE & CONVERT!
      parent: 'Sunil Gupta',
      phone: '+91 98765 43210',
      email: 'sunil.gupta@example.com',
    },
    {
      app_no: 'ADM-2026-0002',
      name: 'Meera Singh',
      status: 'approved',
      parent: 'Rajeev Singh',
      phone: '+91 98765 43211',
      email: 'rajeev.singh@example.com',
    },
    {
      app_no: 'ADM-2026-0003',
      name: 'Kabir Khan',
      status: 'converted',
      parent: 'Tariq Khan',
      phone: '+91 98765 43212',
      email: 'tariq.khan@example.com',
    },
    {
      app_no: 'ADM-2026-0004',
      name: 'Tanya Verma',
      status: 'submitted',
      parent: 'Alok Verma',
      phone: '+91 98765 43213',
      email: 'alok.verma@example.com',
    },
    {
      app_no: 'ADM-2026-0005',
      name: 'Dev Sharma',
      status: 'draft',
      parent: 'Naveen Sharma',
      phone: '+91 98765 43214',
      email: 'naveen.sharma@example.com',
    },
  ]

  const admissionRows = admissionApps.map((a, idx) => ({
    id: `00000000-0000-4000-e000-${String(idx + 1).padStart(12, '0')}`,
    school_id: SCHOOL_ID,
    academic_session_id: activeSessionId,
    application_number: a.app_no,
    applicant_first_name: a.name.split(' ')[0],
    applicant_last_name: a.name.split(' ')[1],
    date_of_birth: '2014-06-15',
    gender: 'male',
    applying_for_class_id: sampleClassId,
    guardian_name: a.parent,
    guardian_phone: a.phone,
    guardian_email: a.email,
    status: a.status,
  }))

  await safeUpsert('admission_applications', admissionRows, 'school_id,application_number')
  console.log(`   ✅ Seeded ${admissionRows.length} admission applications.`)

  // -------------------------------------------------------------------------
  // 8. AUDIT LOGS
  // -------------------------------------------------------------------------
  console.log('🛡️ 8. Seeding Realistic Audit Trail...')
  const auditLogs = [
    {
      id: '00000000-0000-4000-f000-000000000001',
      school_id: SCHOOL_ID,
      actor_profile_id: 'e1000001-0002-4ef8-bb6d-6bb9bd380a11', // Admin
      action: 'CREATE_STUDENT',
      entity_type: 'students',
      entity_id: STUDENT_ARJUN_ID,
      new_data: { admission_number: 'RPS-2026-0101', name: 'Arjun Kumar', class: 'Class 10-A', demo_seed: true },
    },
    {
      id: '00000000-0000-4000-f000-000000000002',
      school_id: SCHOOL_ID,
      actor_profile_id: 'e1000001-0005-4ef8-bb6d-6bb9bd380a11', // Accountant
      action: 'COLLECT_FEE',
      entity_type: 'payments',
      new_data: { receipt: 'RPS-FEE-2026-004581', amount: 14500, mode: 'UPI', demo_seed: true },
    },
    {
      id: '00000000-0000-4000-f000-000000000003',
      school_id: SCHOOL_ID,
      actor_profile_id: 'e1000001-0004-4ef8-bb6d-6bb9bd380a11', // Teacher
      action: 'SUBMIT_ATTENDANCE',
      entity_type: 'attendance_sessions',
      new_data: { class: 'Class 10-A', date: '2026-08-14', present_count: 24, absent_count: 2, demo_seed: true },
    },
  ]
  await safeUpsert('audit_logs', auditLogs, 'id')

  console.log('======================================================================')
  console.log('🎉 SEEDING COMPLETE! The demo database is populated.')
  console.log('======================================================================')
}

seed().catch(err => {
  console.error('❌ Seeding failed with error:', err)
})
