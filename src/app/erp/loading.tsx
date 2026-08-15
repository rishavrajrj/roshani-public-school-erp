export default function ERPLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard...">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded-md" />
          <div className="h-8 w-64 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-96 max-w-full bg-slate-200 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* 4 KPI Metric Card Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between"
          >
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-7 w-20 bg-slate-200 rounded-md" />
              <div className="h-2.5 w-32 bg-slate-100 rounded" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/60" />
          </div>
        ))}
      </div>

      {/* Quick Launch Action Ribbon Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="h-3 w-40 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-100 h-20 gap-2"
            >
              <div className="w-6 h-6 rounded-md bg-slate-200" />
              <div className="h-2.5 w-16 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Operational Panels Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-4 w-44 bg-slate-200 rounded" />
                <div className="h-3 w-56 bg-slate-100 rounded" />
              </div>
              <div className="h-4 w-16 bg-slate-200 rounded" />
            </div>
            <div className="p-5 space-y-4">
              {[1, 2, 3].map((row) => (
                <div key={row} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-32 bg-slate-200 rounded" />
                      <div className="h-2.5 w-24 bg-slate-100 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
