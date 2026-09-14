/**
 * Compact KPI tile. `tone` colours the value; `note` is the small line under
 * it. Kept deliberately flat: thin border, no glow, mono numbers.
 */
const TONES = {
  neutral: 'text-slate-100',
  accent: 'text-accent',
  growth: 'text-growth',
  water: 'text-water',
  warn: 'text-warn',
  danger: 'text-danger',
  co2: 'text-co2',
  o2: 'text-o2',
  muted: 'text-slate-400',
}

export default function MetricCard({ label, value, unit, note, noteTone = 'muted', tone = 'neutral', isLoading, title, size = 'md' }) {
  const valueSize = size === 'lg' ? 'text-2xl sm:text-3xl' : size === 'sm' ? 'text-base' : 'text-xl'
  return (
    <article
      className="min-w-0 rounded-md border border-line bg-space-800/50 px-3 py-2.5"
      aria-busy={isLoading || undefined}
      title={title}
    >
      <p className="label-tech truncate">{label}</p>
      <p className={`mt-1 flex items-baseline gap-1 transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
        <span className={`font-mono font-semibold tabular-nums ${valueSize} ${TONES[tone] ?? TONES.neutral}`}>{value}</span>
        {unit && <span className="text-[11px] text-slate-500">{unit}</span>}
      </p>
      {note && <p className={`mt-0.5 truncate text-[11px] ${TONES[noteTone] ?? TONES.muted}`}>{note}</p>}
    </article>
  )
}
