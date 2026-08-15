import { SkeletonPageHeader, SkeletonTable, SkeletonTwoColumn } from '@/components/ui/skeleton'

export default function CollectionsLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      <SkeletonPageHeader />
      <SkeletonTable rows={6} cols={6} />
      <SkeletonTwoColumn />
    </div>
  )
}
