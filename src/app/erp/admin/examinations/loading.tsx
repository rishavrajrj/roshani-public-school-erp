import { Skeleton, SkeletonPageHeader, SkeletonTable } from '@/components/ui/skeleton'

export default function ExaminationsLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-6 w-48 rounded" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        ))}
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}
