import {
  SkeletonPageHeader,
  SkeletonMetricGrid,
  SkeletonQuickActions,
  SkeletonTwoColumn,
} from '@/components/ui/skeleton'

export default function PrincipalDashboardLoading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      <SkeletonPageHeader />
      <SkeletonMetricGrid count={4} />
      <SkeletonQuickActions />
      <SkeletonTwoColumn />
    </div>
  )
}
