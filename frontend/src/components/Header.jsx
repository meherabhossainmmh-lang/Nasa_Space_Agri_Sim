import StatusBadge from './StatusBadge.jsx'

/**
 * Top bar: project title, phase tag and backend status.
 */
export default function Header({ isLoading, error }) {
  return (
    <header className="sticky top-0 z-20 border-b border-space-700/70 bg-space-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 text-xl shadow-[0_0_24px_-6px_rgba(34,211,238,0.8)]">
            🌱
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-wide text-slate-100 sm:text-xl">
              SpaceAgriSim
              <span className="rounded-full border border-neon-purple/40 bg-neon-purple/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-neon-purple">
                Phase 1
              </span>
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">Space Agriculture &amp; Life Support Simulator</p>
          </div>
        </div>
        <StatusBadge isLoading={isLoading} error={error} />
      </div>
    </header>
  )
}
