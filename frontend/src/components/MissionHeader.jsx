import SystemStatus from './SystemStatus.jsx'

/**
 * Top bar: product identity on the left, system status on the right.
 * Sticky so the status stays visible while scrolling through the results.
 */
export default function MissionHeader({ isLoading, error, hasResult }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-space-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Emblem />
          <div className="min-w-0">
            <p className="whitespace-nowrap font-mono text-[12px] font-semibold tracking-[0.2em] text-slate-100 sm:text-sm sm:tracking-[0.28em]">
              SPACEAGRISIM
            </p>
            <p className="label-tech hidden truncate sm:block">Space agriculture &amp; life support simulation</p>
            <p className="label-tech truncate sm:hidden">Mathematical prototype · Phase 1</p>
          </div>
          <span className="ml-1 hidden shrink-0 rounded border border-line-strong px-2 py-0.5 font-mono text-[10px] tracking-[0.18em] text-slate-400 lg:inline">
            PHASE 1 • MATHEMATICAL PROTOTYPE
          </span>
        </div>
        <SystemStatus isLoading={isLoading} error={error} hasResult={hasResult} />
      </div>
    </header>
  )
}

/** Small inline SVG mark: a leaf inside an orbit ring. */
function Emblem() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      aria-hidden="true"
      className="shrink-0 rounded-md border border-line bg-space-900"
    >
      <circle cx="17" cy="17" r="11" fill="none" stroke="#22d3ee" strokeOpacity="0.55" strokeWidth="1" />
      <ellipse cx="17" cy="17" rx="14" ry="5" fill="none" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="1" />
      <path d="M17 23c0-6 3-9 8-10-1 5-3 8-8 10z" fill="#4ade80" fillOpacity="0.9" />
      <path d="M17 23c0-6-3-9-8-10 1 5 3 8 8 10z" fill="#4ade80" fillOpacity="0.55" />
      <line x1="17" y1="23" x2="17" y2="12.5" stroke="#04070f" strokeWidth="0.8" />
    </svg>
  )
}
