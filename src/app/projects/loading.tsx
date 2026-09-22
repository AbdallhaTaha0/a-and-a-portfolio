export default function ProjectsLoading() {
  return (
    <div className="relative z-10 mx-auto min-h-screen w-[min(calc(100%-2rem),80rem)] py-20" aria-busy="true" aria-label="Loading projects">
      <div className="h-4 w-28 animate-pulse rounded bg-[#ffb800]/25" />
      <div className="mt-5 h-16 max-w-md animate-pulse rounded-2xl bg-white/10" />
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => <div className="aspect-[4/5] animate-pulse rounded-3xl border border-white/10 bg-white/[0.035]" key={item} />)}
      </div>
    </div>
  );
}
