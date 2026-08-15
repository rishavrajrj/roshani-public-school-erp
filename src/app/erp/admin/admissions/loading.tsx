import { SkeletonPageHeader, SkeletonFilterBar, SkeletonTable } from '@/components/ui/skeleton'

export default function AdmissionsLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      <SkeletonPageHeader />
      <SkeletonFilterBar fields={4} />
      <SkeletonTable rows={7} cols={6} />
    </div>
  )
}
