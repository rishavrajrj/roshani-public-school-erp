import { Skeleton, SkeletonPageHeader } from '@/components/ui/skeleton'

export default function StudentDetailLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full animate-in fade-in duration-150">
      <SkeletonPageHeader />
      
      {/* Student Profile Card Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-6">
        <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-3 w-full text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="space-y-1">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex border-b border-slate-200 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-t-lg" />
        ))}
      </div>

      {/* Tab content placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <Skeleton className="h-5 w-40 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
