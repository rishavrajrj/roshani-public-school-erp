'use client'

import React, { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { EmptyState } from './empty-state'
import { SkeletonTable } from './skeleton'

export interface ColumnDef<T> {
  key: string
  header: string
  sortable?: boolean
  className?: string
  cell: (item: T, index: number) => React.ReactNode
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  keyExtractor: (item: T) => string
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: (keyof T | string)[]
  filterControls?: React.ReactNode
  actionControls?: React.ReactNode
  pageSize?: number
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  filterControls,
  actionControls,
  pageSize = 10,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your current filters or query.',
  emptyActionLabel,
  onEmptyAction,
  className = '',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  // Filter based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data
    const query = searchQuery.toLowerCase().trim()

    return data.filter((item) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = item[k as keyof T]
          return val !== null && val !== undefined && String(val).toLowerCase().includes(query)
        })
      }
      return Object.values(item).some((val) => {
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(query)
        }
        return false
      })
    })
  }, [data, searchQuery, searchKeys])

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]
      if (valA === valB) return 0
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1
      if (valA < valB) return sortAsc ? -1 : 1
      return sortAsc ? 1 : -1
    })
  }, [filteredData, sortKey, sortAsc])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  if (isLoading) {
    return <SkeletonTable rows={pageSize > 6 ? 6 : pageSize} cols={columns.length} />
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col ${className}`}>
      {/* Table Toolbar */}
      {(searchable || filterControls || actionControls) && (
        <div className="p-4 sm:p-5 border-b border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            {searchable && (
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full h-9.5 pl-9 pr-3 text-xs sm:text-sm bg-white text-slate-900 font-medium rounded-lg border border-slate-300 placeholder:text-slate-400 focus:outline-none focus:border-[#1554C0] focus:ring-2 focus:ring-blue-600/15 shadow-2xs transition"
                />
              </div>
            )}
            {filterControls && <div className="flex items-center gap-2 flex-wrap">{filterControls}</div>}
          </div>
          {actionControls && <div className="flex items-center gap-2 flex-wrap shrink-0">{actionControls}</div>}
        </div>
      )}

      {/* Table Content */}
      {paginatedData.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={searchQuery ? 'Clear search filter' : emptyActionLabel}
            onAction={searchQuery ? () => setSearchQuery('') : onEmptyAction}
          />
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px] font-mono">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`py-3.5 px-4 ${col.sortable ? 'cursor-pointer select-none hover:text-slate-900' : ''} ${
                      col.className || ''
                    }`}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-900">
              {paginatedData.map((item, index) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`py-3.5 px-4 font-medium ${col.className || ''}`}>
                      {col.cell(item, (currentPage - 1) * pageSize + index)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {sortedData.length > pageSize && (
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-900 font-bold">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-900 font-bold">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </strong>{' '}
            of <strong className="text-slate-900 font-bold">{sortedData.length}</strong> records
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
