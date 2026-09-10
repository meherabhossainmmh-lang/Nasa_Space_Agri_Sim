/**
 * Single KPI tile. `tone` picks the accent colour, `delta` is an optional
 * secondary line (e.g. "-16% vs Earth").
 */
const TONES = {
  green: { text: 'text-neon-green', glow: 'from-neon-green/20', ring: 'group-hover:border-neon-green/50' },
  blue: { text: 'text-neon-blue', glow: 'from-neon-blue/20', ring: 'group-hover:border-neon-blue/50' },
  cyan: { text: 'text-neon-cyan', glow: 'from-neon-cyan/20', ring: 'group-hover:border-neon-cyan/50' },
  purple: { text: 'text-neon-purple', glow: 'from-neon-purple/20', ring: 'group-hover:border-neon-purple/50' },
  amber: { text: 'text-neon-amber', glow: 'from-neon-amber/20', ring: 'group-hover:border-neon-amber/50' },
  rose: { text: 'text-neon-rose', glow: 'from-neon-rose/20', ring: 'group-hover:border-neon-rose/50' },
}

export default function MetricCard({ icon, label, value, unit, delta, deltaTone, hint, tone = 'cyan', isLoading }) {
  const t = TONES[tone] ?? TONES.cyan
  const deltaColor =
    deltaTone === 'good' ? 'text-neon-green' : deltaTone === 'bad' ? 'text-neon-rose' : 'text-slate-400'

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-space-700/70 bg-space-900/70 p-4 transition ${t.ring}`}
      aria-busy={isLoading || undefined}
    >
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${t.glow} to-transparent blur-2xl`} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-lg" aria-hidden="true">
          {icon}
        </span>
      </div>
      <div className={`mt-2 flex items-baseline gap-1 transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
        <span className={`font-mono text-2xl font-semibold tabular-nums ${t.text}`}>{value}</span>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
      {(delta || hint) && (
        <p className="mt-1 text-xs">
          {delta && <span className={`font-medium ${deltaColor}`}>{delta}</span>}
          {delta && hint && <span className="text-slate-500"> · </span>}
          {hint && <span className="text-slate-500">{hint}</span>}
        </p>
      )}
    </article>
  )
}
