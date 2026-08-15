import { SkeletonPageHeader, SkeletonFilterBar, SkeletonTable } from '@/components/ui/skeleton'

export default function StudentsListLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      <SkeletonPageHeader />
      <SkeletonFilterBar fields={5} />
      <SkeletonTable rows={8} cols={7} />
    </div>
  )
}
