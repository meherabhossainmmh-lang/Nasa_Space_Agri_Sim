import { formatFactor, formatPercent, formatPoints } from '../services/formatters.js'

/**
 * WHY IS SPACE DIFFERENT? - waterfall from the Earth reference (100 %) to
 * the space yield, one bar per driver. Every number comes from
 * `comparison.impact` in the API response; the bars only draw them.
 *
 * Bar semantics (per driver):
 *   the bar length is the driver's own effect vs the Earth run (`percent`);
 *   the small mono figure on the right is how many percentage points of the
 *   final gap that driver explains (`contributionPoints`).
 */
const SCALE_MAX = 40 // bars are clipped at ±40 % so one huge effect does not flatten the rest

export default function ImpactBreakdown({ impact, mode }) {
  if (!impact) return null

  return (
    <div>
      <ul className="space-y-2">
        {impact.factors.map((f) => (
          <ImpactRow key={f.key} factor={f} mode={mode} />
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3 rounded border border-line bg-space-800/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="label-tech">Combined</span>
          <span className="text-[10px] text-slate-500">product of all factors</span>
        </div>
        <span
          className={`font-mono text-sm font-semibold tabular-nums ${
            impact.combinedPercent < -0.05 ? 'text-danger' : impact.combinedPercent > 0.05 ? 'text-growth' : 'text-slate-300'
          }`}
        >
          {formatPercent(impact.combinedPercent, { signed: true })} vs Earth
        </span>
      </div>
    </div>
  )
}

function ImpactRow({ factor, mode }) {
  const pct = factor.percent
  const clipped = Math.max(Math.min(pct, SCALE_MAX), -SCALE_MAX)
  const width = (Math.abs(clipped) / SCALE_MAX) * 50 // half the track on each side of zero
  const negative = pct < -0.05
  const positive = pct > 0.05
  const barColor = negative ? 'bg-danger/80' : positive ? 'bg-growth/80' : 'bg-slate-500/60'
  const textColor = negative ? 'text-danger' : positive ? 'text-growth' : 'text-slate-400'

  // in matched mode the resources are identical in both runs, so their own
  // response is still worth showing even though it explains none of the gap
  const sharedResource = mode === 'matched' && ['water', 'light', 'co2'].includes(factor.key)
  const showResponse = sharedResource && Math.abs(factor.responsePercent) > 0.05

  return (
    <li className="grid grid-cols-[5.5rem_minmax(0,1fr)_4.2rem] items-center gap-2 sm:grid-cols-[6.5rem_minmax(0,1fr)_5.5rem]">
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-200">{factor.label === 'CO2' ? 'CO₂' : factor.label}</p>
        <p className="truncate font-mono text-[10px] text-slate-500">
          {formatFactor(factor.spaceFactor)}
          {factor.earthFactor !== 1 && ` / ${formatFactor(factor.earthFactor)}`}
        </p>
      </div>
      <div className="relative h-4 rounded-sm bg-space-800" aria-hidden="true">
        <span className="absolute left-1/2 top-0 h-full w-px bg-line-strong" />
        <span
          className={`absolute top-1 h-2 rounded-sm ${barColor}`}
          style={negative ? { right: '50%', width: `${width}%` } : { left: '50%', width: `${width}%` }}
        />
        {Math.abs(pct) > SCALE_MAX && (
          <span className={`absolute top-0 font-mono text-[9px] leading-4 ${textColor} ${negative ? 'left-0' : 'right-0'}`}>
            {negative ? '◂' : '▸'}
          </span>
        )}
      </div>
      <div className="text-right">
        <p className={`font-mono text-xs font-semibold tabular-nums ${textColor}`}>{formatPercent(pct, { signed: true, digits: 1 })}</p>
        <p className="font-mono text-[10px] tabular-nums text-slate-500" title="Share of the final Earth-vs-space gap this driver explains">
          {showResponse ? `shared ${formatPercent(factor.responsePercent, { signed: true, digits: 0 })}` : formatPoints(factor.contributionPoints)}
        </p>
      </div>
      <span className="sr-only">
        {factor.label}: {formatPercent(pct, { signed: true })} versus Earth, contributing {formatPoints(factor.contributionPoints)} to the combined difference.
      </span>
    </li>
  )
}
