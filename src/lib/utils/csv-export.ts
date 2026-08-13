'use client'

/**
 * Client-side CSV export utility.
 * Generates a CSV file from an array of objects and triggers a browser download.
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns?: { key: string; label: string }[]
): void {
  if (data.length === 0) return

  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }))

  // Header row
  const header = cols.map((c) => `"${c.label}"`).join(',')

  // Data rows
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const val = row[c.key]
        if (val === null || val === undefined) return '""'
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      })
      .join(',')
  )

  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * Formats a number as Indian Rupee currency string.
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Gets date range presets for collection reports.
 */
export function getDatePreset(preset: string): { from: string; to: string } {
  const today = new Date()
  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  switch (preset) {
    case 'today':
      return { from: fmt(today), to: fmt(today) }
    case 'yesterday': {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      return { from: fmt(y), to: fmt(y) }
    }
    case 'this_week': {
      const start = new Date(today)
      start.setDate(start.getDate() - start.getDay())
      return { from: fmt(start), to: fmt(today) }
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: fmt(start), to: fmt(today) }
    }
    case 'prev_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: fmt(start), to: fmt(end) }
    }
    case 'academic_session': {
      // Academic session typically starts April 1
      const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
      return { from: `${year}-04-01`, to: fmt(today) }
    }
    default:
      return { from: fmt(today), to: fmt(today) }
  }
}
