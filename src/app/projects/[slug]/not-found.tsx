import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <main className="relative z-10 grid min-h-screen place-items-center px-5 text-center">
      <div>
        <p className="text-xs font-bold tracking-[0.16em] text-[#ffc83d] uppercase">Project unavailable</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.05em]">This project is not published.</h1>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-white/55">It may still be in draft, have moved, or no longer be available.</p>
        <Link className="mt-8 inline-flex rounded-full bg-[#ffb800] px-6 py-3 font-bold text-[#080808]" href="/projects">Browse published projects</Link>
      </div>
    </main>
  );
}
