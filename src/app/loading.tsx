export default function PublicLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading page"
      className="relative z-10 mx-auto min-h-screen w-[min(calc(100%-2rem),80rem)] py-10 sm:py-16"
    >
      <div className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025] motion-reduce:animate-none" />
      <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(18rem,0.6fr)] lg:items-center">
        <div>
          <div className="h-3 w-32 animate-pulse rounded-full bg-[#ffb800]/40 motion-reduce:animate-none" />
          <div className="mt-6 h-14 max-w-xl animate-pulse rounded-2xl bg-white/10 motion-reduce:animate-none" />
          <div className="mt-4 h-14 max-w-md animate-pulse rounded-2xl bg-white/10 motion-reduce:animate-none" />
          <div className="mt-8 h-5 max-w-lg animate-pulse rounded-full bg-white/5 motion-reduce:animate-none" />
        </div>
        <div className="aspect-[16/10] animate-pulse rounded-[1.75rem] border border-white/10 bg-white/[0.035] motion-reduce:animate-none" />
      </div>
      <p className="sr-only" role="status">
        Loading page content…
      </p>
    </main>
  );
}
