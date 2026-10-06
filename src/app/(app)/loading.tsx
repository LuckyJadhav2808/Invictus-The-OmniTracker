export default function AppRouteLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="w-full h-32 rounded-2xl bg-white border-2 border-[#161514]/20 shadow-[3px_3px_0px_0px_rgba(22,21,20,0.1)] p-6 flex flex-col justify-between">
        <div className="h-4 w-32 bg-[#161514]/10 rounded-md" />
        <div className="space-y-2">
          <div className="h-7 w-64 bg-[#161514]/15 rounded-lg" />
          <div className="h-3 w-80 bg-[#161514]/10 rounded-md" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-white border-2 border-[#161514]/20 rounded-xl p-4 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(22,21,20,0.1)]"
          >
            <div className="h-3 w-20 bg-[#161514]/10 rounded" />
            <div className="h-6 w-24 bg-[#161514]/15 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 bg-white border-2 border-[#161514]/20 rounded-xl p-4 flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(22,21,20,0.1)]"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-[#161514]/10" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 bg-[#161514]/15 rounded" />
                <div className="h-2.5 w-24 bg-[#161514]/10 rounded" />
              </div>
            </div>
            <div className="size-6 rounded-md bg-[#161514]/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
