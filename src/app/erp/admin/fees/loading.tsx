import { Skeleton, SkeletonPageHeader, SkeletonMetricGrid } from '@/components/ui/skeleton'

export default function FeesLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      <SkeletonPageHeader />
      <SkeletonMetricGrid count={4} />
      <div className="flex border-b border-slate-200 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-t-lg" />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <Skeleton className="h-5 w-48 rounded" />
        <div className="space-y-2 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
