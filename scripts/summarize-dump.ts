import * as fs from 'fs'
import * as path from 'path'

const dumpPath = path.resolve(process.cwd(), 'scripts', 'all_tables_dump.json')
const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'))

const summary: any[] = []
for (const [table, records] of Object.entries(data)) {
  if (Array.isArray(records) && records.length > 0) {
    summary.push({
      table,
      count: records.length,
      columns: Object.keys(records[0]),
      firstRecord: records[0]
    })
  }
}

console.log(JSON.stringify(summary, null, 2))
