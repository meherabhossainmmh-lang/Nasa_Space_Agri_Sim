/**
 * Error surface styled as a system alert.
 *   422 -> SIMULATION INPUT INVALID (amber): lists the rejected fields
 *   other -> SIMULATION UNAVAILABLE (red): backend unreachable or crashed
 */
export default function SystemAlert({ error, onRetry }) {
  const invalid = error?.status === 422
  const fields = invalid && error.details?.fields ? Object.entries(error.details.fields) : []
  const tone = invalid
    ? { border: 'border-warn/50', bg: 'bg-warn/5', text: 'text-warn', dot: 'bg-warn' }
    : { border: 'border-danger/50', bg: 'bg-danger/5', text: 'text-danger', dot: 'bg-danger' }

  return (
    <div className={`flex items-start gap-3 rounded-md border px-4 py-3 ${tone.border} ${tone.bg}`} role="alert">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className={`font-mono text-[11px] tracking-[0.18em] ${tone.text}`}>{invalid ? 'SIMULATION INPUT INVALID' : 'SIMULATION UNAVAILABLE'}</p>
        <p className="mt-0.5 text-xs text-slate-300">{error.message}</p>
        {fields.length > 0 && (
          <ul className="mt-1 space-y-0.5 font-mono text-[11px] text-slate-400">
            {fields.map(([name, msg]) => (
              <li key={name}>
                <span className="text-slate-200">{name}</span>: {msg}
              </li>
            ))}
          </ul>
        )}
        {!invalid && <p className="mt-1 text-[11px] text-slate-500">The last successful result stays on screen. Start the API server on port 8000 and retry.</p>}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className={`shrink-0 rounded border px-2.5 py-1 font-mono text-[10px] tracking-wider transition-colors hover:bg-white/5 ${tone.border} ${tone.text}`}
      >
        RETRY
      </button>
    </div>
  )
}
