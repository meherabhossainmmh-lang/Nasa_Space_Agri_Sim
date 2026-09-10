/**
 * Small pill showing whether the backend link is healthy / busy / broken.
 */
export default function StatusBadge({ isLoading, error }) {
  let color = 'bg-neon-green'
  let text = 'Backend linked'
  if (error) {
    color = 'bg-neon-rose'
    text = 'Backend offline'
  } else if (isLoading) {
    color = 'bg-neon-amber animate-pulse'
    text = 'Simulating…'
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-space-700 bg-space-900/80 px-3 py-1 text-xs text-slate-300">
      <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
      {text}
    </span>
  )
}
