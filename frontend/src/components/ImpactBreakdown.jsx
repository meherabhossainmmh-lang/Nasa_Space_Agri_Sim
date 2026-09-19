import { formatFactor, formatPercent, formatPoints } from '../services/formatters.js'

/**
 * WHY IS SPACE DIFFERENT? - one row per driver, all values read from
 * `comparison.impact` in the API response; the bars only draw them.
 *
 * Each row shows two different things and labels them as such:
 *
 *   bar + big figure   the driver's own multiplier on growth, relative to the
 *                      crop's reference conditions (`responsePercent`, e.g.
 *                      CO2 at 1000 ppm -> x1.18 -> "+18% growth support")
 *   small figure       how many percentage points of the Earth-vs-space gap
 *                      the driver explains (`contributionPoints`). A driver
 *                      that is identical in both runs (matched mode) supports
 *                      growth but explains none of the gap, so it reads
 *                      "same in Earth run".
 *
 * The combined box closes the arithmetic explicitly: growth is linear in the
 * combined factor, so space / Earth = combined(space) / combined(Earth). Both
 * factors are measured against the same reference conditions, and in matched
 * mode the Earth run is not x1.00 (it keeps the user's CO2 / water / light),
 * which is why x0.93 of reference growth can still be 79 % of Earth.
 */
const SCALE_MAX = 40 // bars are clipped at ±40 % so one huge effect does not flatten the rest
const EPS = 0.05

export default function ImpactBreakdown({ impact, spaceCombined, earthCombined }) {
  if (!impact) return null
  const combinedTone = impact.combinedPercent < -EPS ? 'text-danger' : impact.combinedPercent > EPS ? 'text-growth' : 'text-slate-300'

  return (
    <div>
      <ul className="space-y-2.5">
        {impact.factors.map((f) => (
          <ImpactRow key={f.key} factor={f} />
        ))}
      </ul>
      <div className="mt-3 rounded border border-line bg-space-800/60 px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="label-tech">Combined</span>
          <span className={`font-mono text-sm font-semibold tabular-nums ${combinedTone}`}>
            {formatPercent(impact.combinedPercent, { signed: true })} vs Earth
          </span>
        </div>
        {spaceCombined != null && earthCombined != null && (
          <p className="mt-1 font-mono text-[11px] leading-snug tabular-nums text-slate-400">
            space {formatFactor(spaceCombined)} ÷ Earth run {formatFactor(earthCombined)} = {formatFactor(spaceCombined / earthCombined)} of reference growth →{' '}
            {formatPercent((spaceCombined / earthCombined) * 100, { digits: 0 })} of Earth
          </p>
        )}
      </div>
    </div>
  )
}

function ImpactRow({ factor }) {
  const effect = factor.responsePercent
  const clipped = Math.max(Math.min(effect, SCALE_MAX), -SCALE_MAX)
  const width = (Math.abs(clipped) / SCALE_MAX) * 50 // half the track on each side of zero
  const negative = effect < -EPS
  const positive = effect > EPS
  const barColor = negative ? 'bg-danger/80' : positive ? 'bg-growth/80' : 'bg-slate-500/60'
  const textColor = negative ? 'text-danger' : positive ? 'text-growth' : 'text-slate-400'
  const effectLabel = negative ? 'growth penalty' : positive ? 'growth support' : 'no effect'

  // identical in both runs: supports growth but does not separate the scenarios
  const shared = Math.abs(factor.contributionPoints) < EPS && Math.abs(effect) > EPS
  const gapLabel = shared ? 'same in Earth run · 0 pts of gap' : `${formatPoints(factor.contributionPoints)} of gap`
  const label = factor.label === 'CO2' ? 'CO₂' : factor.label

  return (
    <li className="grid grid-cols-[4rem_minmax(0,1fr)_9rem] items-center gap-2 sm:grid-cols-[6.5rem_minmax(0,1fr)_11rem]">
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-200">{label}</p>
        <p className="truncate font-mono text-[10px] text-slate-500">{formatFactor(factor.spaceFactor)}</p>
      </div>
      <div className="relative h-4 min-w-0 rounded-sm bg-space-800" aria-hidden="true">
        <span className="absolute left-1/2 top-0 h-full w-px bg-line-strong" />
        <span
          className={`absolute top-1 h-2 rounded-sm ${barColor}`}
          style={negative ? { right: '50%', width: `${width}%` } : { left: '50%', width: `${width}%` }}
        />
        {Math.abs(effect) > SCALE_MAX && (
          <span className={`absolute top-0 font-mono text-[9px] leading-4 ${textColor} ${negative ? 'left-0' : 'right-0'}`}>
            {negative ? '◂' : '▸'}
          </span>
        )}
      </div>
      <div className="min-w-0 text-right">
        <p className={`font-mono text-xs font-semibold leading-tight tabular-nums ${textColor}`}>
          {formatPercent(effect, { signed: true, digits: 0 })} <span className="font-normal">{effectLabel}</span>
        </p>
        <p className="font-mono text-[10px] leading-tight tabular-nums text-slate-500" title="Percentage points of the Earth-vs-space difference this driver explains">
          {gapLabel}
        </p>
      </div>
      <span className="sr-only">
        {label}: multiplier {formatFactor(factor.spaceFactor)}, {formatPercent(effect, { signed: true })} {effectLabel};{' '}
        {shared ? 'shared with the Earth run, so it explains none of the gap' : `${formatPoints(factor.contributionPoints)} of the Earth versus space gap`}.
      </span>
    </li>
  )
}
