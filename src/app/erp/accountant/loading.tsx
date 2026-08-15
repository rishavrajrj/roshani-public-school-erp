import {
  SkeletonPageHeader,
  SkeletonMetricGrid,
  SkeletonTwoColumn,
} from '@/components/ui/skeleton'

export default function AccountantDashboardLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      <SkeletonPageHeader />
      <SkeletonMetricGrid count={4} />
      <SkeletonTwoColumn />
    </div>
  )
}
