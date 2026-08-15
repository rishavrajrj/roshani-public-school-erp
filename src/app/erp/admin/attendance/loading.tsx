import { Skeleton, SkeletonPageHeader } from '@/components/ui/skeleton'

export default function AttendanceLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      <SkeletonPageHeader />
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
