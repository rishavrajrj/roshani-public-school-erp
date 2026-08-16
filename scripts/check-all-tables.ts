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

async function checkAll() {
  // Let's inspect complete_schema_bundle.sql or tables mentioned in codebase
  const schemaFile = fs.readFileSync(path.resolve(process.cwd(), 'supabase', 'complete_schema_bundle.sql'), 'utf8')
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi
  const matches = new Set<string>()
  let match
  while ((match = createTableRegex.exec(schemaFile)) !== null) {
    matches.add(match[1])
  }

  console.log(`Found ${matches.size} table definitions in complete_schema_bundle.sql`)

  const results: Record<string, any[]> = {}
  for (const t of Array.from(matches).sort()) {
    try {
      const { data, error } = await supabase.from(t).select('*')
      if (!error && data) {
        results[t] = data
      }
    } catch (e) {}
  }

  console.log('\n=== REAL ACCESSIBLE TABLES IN SUPABASE ===')
  for (const [tbl, data] of Object.entries(results)) {
    console.log(`${tbl}: ${data.length} records`)
  }

  fs.writeFileSync(path.resolve(process.cwd(), 'scripts', 'all_tables_full_export.json'), JSON.stringify(results, null, 2))
}

checkAll().catch(console.error)
