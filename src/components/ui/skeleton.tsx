import React from 'react'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-200/80 animate-pulse rounded-lg ${className}`} />
}

export function SkeletonPageHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 rounded" />
          <span className="text-slate-300">/</span>
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <Skeleton className="h-7 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
    </div>
  )
}

export function SkeletonMetricGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="w-8 h-8 rounded-xl" />
          </div>
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonQuickActions() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <Skeleton className="h-3.5 w-40 rounded" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center space-y-2"
          >
            <Skeleton className="w-6 h-6 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonFilterBar({ fields = 4 }: { fields?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3.5">
        <div className="md:col-span-2 space-y-1.5">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
        {Array.from({ length: fields - 1 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ))}
        <div className="flex items-end gap-2">
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-16 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Skeleton className="w-8 h-8 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <Skeleton className="h-3.5 w-3/4 rounded" />
                <Skeleton className="h-2.5 w-1/2 rounded" />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3.5 w-16 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-7 w-16 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonTwoColumn() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-56 rounded" />
            </div>
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-32 rounded" />
                  <Skeleton className="h-2.5 w-24 rounded" />
                </div>
                <Skeleton className="h-6 w-14 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
