import * as fs from 'fs'
import * as path from 'path'

const dumpPath = path.resolve(process.cwd(), 'scripts', 'all_tables_dump.json')
const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'))

for (const t of ['schools', 'academic_sessions', 'roles', 'examinations', 'exam_types', 'audit_logs']) {
  console.log(`=== TABLE: ${t} ===`)
  console.log(JSON.stringify(data[t], null, 2))
}
