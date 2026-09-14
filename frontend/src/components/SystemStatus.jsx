/**
 * SYSTEM STATUS block for the header: backend link + simulation state.
 *
 * States (in priority order):
 *   error      -> BACKEND UNREACHABLE (red)   or SIMULATION INPUT INVALID (amber)
 *   loading    -> SIMULATING… (amber, pulsing)
 *   ready      -> BACKEND CONNECTED · SIMULATION READY / UPDATED (teal/green)
 */
export default function SystemStatus({ isLoading, error, hasResult, compact = false }) {
  const inputInvalid = error?.status === 422
  const backendDown = error && !inputInvalid

  const backend = backendDown
    ? { dot: 'bg-danger', text: 'BACKEND UNREACHABLE', short: 'OFFLINE', tone: 'text-danger' }
    : { dot: 'bg-growth', text: 'BACKEND CONNECTED', short: 'ONLINE', tone: 'text-slate-200' }

  let simulation
  if (inputInvalid) simulation = { dot: 'bg-warn', text: 'SIMULATION INPUT INVALID', short: 'INPUT INVALID', tone: 'text-warn' }
  else if (backendDown) simulation = { dot: 'bg-slate-500', text: 'SIMULATION PAUSED', short: 'PAUSED', tone: 'text-slate-400' }
  else if (isLoading) simulation = { dot: 'bg-warn status-pulse', text: 'SIMULATING…', short: 'SIMULATING…', tone: 'text-warn' }
  else if (hasResult) simulation = { dot: 'bg-accent', text: 'SIMULATION UPDATED', short: 'UPDATED', tone: 'text-accent' }
  else simulation = { dot: 'bg-accent', text: 'SIMULATION READY', short: 'READY', tone: 'text-accent' }

  return (
    <div
      className={`flex shrink-0 items-center gap-2 rounded-md border border-line bg-space-900/80 px-2.5 py-1.5 sm:gap-3 sm:px-3 ${compact ? '' : 'md:gap-4'}`}
      role="status"
      aria-live="polite"
      aria-label={`System status: ${backend.text}, ${simulation.text}`}
    >
      {!compact && <span className="label-tech hidden md:inline">System status</span>}
      <StatusItem {...backend} />
      <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
      <StatusItem {...simulation} />
    </div>
  )
}

function StatusItem({ dot, text, short, tone }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px] tracking-[0.14em] ${tone}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      <span className="hidden md:inline">{text}</span>
      <span className="md:hidden">{short}</span>
    </span>
  )
}
