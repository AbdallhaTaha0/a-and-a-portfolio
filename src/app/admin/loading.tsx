export default function DashboardLoading() {
  return (
    <div className="relative z-10 min-h-screen bg-[#080808] px-5 py-12 sm:px-8" role="status" aria-label="Loading dashboard">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-3 w-36 rounded-full bg-[#ffb800]/30" />
        <div className="mt-5 h-12 max-w-xl rounded-2xl bg-white/10" />
        <div className="mt-4 h-5 max-w-2xl rounded-full bg-white/5" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div className="h-40 rounded-3xl border border-white/10 bg-white/[0.03]" key={item} />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading dashboard</span>
    </div>
  );
}
