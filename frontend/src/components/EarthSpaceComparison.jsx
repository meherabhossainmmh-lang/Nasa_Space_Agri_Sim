import Panel from './Panel.jsx'
import SegmentedToggle from './SegmentedToggle.jsx'
import ImpactBreakdown from './ImpactBreakdown.jsx'
import { formatMass, formatPercent } from '../services/formatters.js'

const MODES = [
  { value: 'matched', label: 'Matched resources' },
  { value: 'baseline', label: 'Earth baseline' },
]

const MODE_HELP = {
  matched:
    'Matched resources: the Earth run keeps your water, light and CO₂ settings, so the difference isolates gravity and radiation.',
  baseline:
    'Earth baseline: the Earth run uses reference resources (100 % water, the crop’s optimal photoperiod, ambient 420 ppm CO₂), so resource settings also show up in the gap.',
}

/**
 * Earth vs space, redesigned as an impact decomposition:
 * two yield bars on top, then the per-driver waterfall.
 */
export default function EarthSpaceComparison({ result, mode, onModeChange }) {
  const c = result?.comparison
  const defined = c?.isDefined !== false
  const maxYield = c ? Math.max(c.earthYield, c.spaceYield, 1) : 1
  const diffTone = !c || !defined ? 'text-slate-400' : c.differencePercent < -0.05 ? 'text-danger' : c.differencePercent > 0.05 ? 'text-growth' : 'text-slate-300'

  return (
    <Panel
      id="earth-space-comparison"
      eyebrow="03"
      title="Why is space different?"
      subtitle="Earth reference vs space scenario, decomposed by driver"
      action={<SegmentedToggle options={MODES} value={mode} onChange={onModeChange} ariaLabel="Earth comparison mode" />}
    >
      {!result ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">Waiting for simulation…</div>
      ) : (
        <div className="space-y-5">
          <p className="text-[11px] leading-snug text-slate-400">{MODE_HELP[mode]}</p>
          <div className="space-y-2">
            <YieldBar label="Earth reference" value={c.earthYield} max={maxYield} color="bg-earth/70" textColor="text-earth" />
            <YieldBar label="Space scenario" value={c.spaceYield} max={maxYield} color="bg-growth/80" textColor="text-growth" />
            <p className={`text-right font-mono text-xs tabular-nums ${diffTone}`}>
              {defined ? (
                <>
                  {formatMass(c.differenceGrams)} · {formatPercent(c.differencePercent, { signed: true })} vs Earth
                </>
              ) : (
                'Earth reference produced no biomass · comparison not defined'
              )}
            </p>
          </div>

          {defined && c.impact ? (
            <div>
              <p className="label-tech mb-2">Impact by driver · effect vs Earth run</p>
              <ImpactBreakdown impact={c.impact} mode={mode} />
              <p className="mt-2 text-[10px] leading-snug text-slate-600">
                Bars show each driver’s own multiplier relative to the Earth run; the small figure is how many percentage points of the
                combined gap it explains once the earlier drivers are applied. Drivers are applied in a fixed order (gravity → radiation →
                water → light → CO₂), so the points add up exactly to the combined difference.
              </p>
            </div>
          ) : (
            <p className="rounded border border-line bg-space-800/60 px-3 py-2 text-[11px] text-slate-400">
              With no Earth biomass there is no gap to decompose. Raise water, light or growing area above zero to compare.
            </p>
          )}
        </div>
      )}
    </Panel>
  )
}

function YieldBar({ label, value, max, color, textColor }) {
  const width = Math.max((value / max) * 100, value > 0 ? 1 : 0)
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)_5rem] items-center gap-2 sm:grid-cols-[7.5rem_minmax(0,1fr)_5.5rem]">
      <span className="truncate text-xs text-slate-300">{label}</span>
      <div className="h-3 rounded-sm bg-space-800" aria-hidden="true">
        <div className={`h-full rounded-sm ${color} transition-[width] duration-300`} style={{ width: `${width}%` }} />
      </div>
      <span className={`text-right font-mono text-xs font-semibold tabular-nums ${textColor}`}>{formatMass(value)}</span>
    </div>
  )
}
