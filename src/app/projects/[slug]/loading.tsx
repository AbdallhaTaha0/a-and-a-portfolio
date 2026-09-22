export default function ProjectLoading() {
  return (
    <div className="relative z-10 mx-auto min-h-screen w-[min(calc(100%-2rem),80rem)] py-20" aria-busy="true" aria-label="Loading project">
      <div className="h-4 w-32 animate-pulse rounded bg-[#ffb800]/25" />
      <div className="mt-7 h-20 max-w-3xl animate-pulse rounded-2xl bg-white/10" />
      <div className="mt-10 aspect-[16/8] animate-pulse rounded-3xl border border-white/10 bg-white/[0.035]" />
    </div>
  );
}
