import Panel from './Panel.jsx'
import SegmentedToggle from './SegmentedToggle.jsx'
import { formatMass, formatPercent } from '../services/formatters.js'

const MODES = [
  { value: 'matched', label: 'Matched resources' },
  { value: 'baseline', label: 'Earth baseline' },
]

const FACTOR_META = [
  { key: 'gravity', label: 'Gravity', icon: '🪐' },
  { key: 'radiation', label: 'Radiation', icon: '☢️' },
  { key: 'water', label: 'Water', icon: '💧' },
  { key: 'light', label: 'Light', icon: '☀️' },
  { key: 'co2', label: 'CO₂', icon: '💨' },
]

function FactorBar({ label, icon, value }) {
  // factors sit around 1.0; show them on a 0..1.4 scale so a CO2 boost is visible
  const clamped = Math.min(Math.max(value, 0), 1.4)
  const width = (clamped / 1.4) * 100
  const tone = value < 0.995 ? 'bg-neon-rose' : value > 1.005 ? 'bg-neon-green' : 'bg-slate-400'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 text-slate-400">
        <span aria-hidden="true">{icon}</span> {label}
      </span>
      <div className="relative h-1.5 flex-1 rounded-full bg-space-700">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
        {/* 1.0 marker */}
        <div className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-slate-500" style={{ left: `${(1 / 1.4) * 100}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right font-mono tabular-nums text-slate-200">×{value.toFixed(2)}</span>
    </div>
  )
}

/**
 * Earth-vs-space summary: yields, signed difference and the growth factors
 * that explain it. Values come straight from the API response.
 */
export default function ComparisonPanel({ result, mode, onModeChange }) {
  const c = result?.comparison
  const diff = c?.differencePercent ?? 0
  const diffTone = diff < -0.05 ? 'text-neon-rose' : diff > 0.05 ? 'text-neon-green' : 'text-slate-200'
  const ratio = c && c.earthYield > 0 ? Math.min(c.spaceYield / c.earthYield, 1.5) : 0

  return (
    <Panel
      title="Earth vs space"
      subtitle={
        mode === 'matched'
          ? 'Earth reference keeps your water, light and CO₂ settings'
          : 'Earth reference uses 100% water, optimal light and ambient CO₂'
      }
      action={<SegmentedToggle options={MODES} value={mode} onChange={onModeChange} ariaLabel="Earth comparison mode" />}
    >
      {!result ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">Waiting for simulation…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
          {/* yields */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">🌍 Earth</p>
                <p className="mt-1 font-mono text-xl font-semibold text-neon-blue">{formatMass(c.earthYield)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">🚀 Space</p>
                <p className="mt-1 font-mono text-xl font-semibold text-neon-green">{formatMass(c.spaceYield)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Difference</p>
                <p className={`mt-1 font-mono text-xl font-semibold ${diffTone}`}>
                  {formatPercent(c.differencePercent, { signed: true })}
                </p>
                <p className="text-[11px] text-slate-500">{formatMass(c.differenceGrams)}</p>
              </div>
            </div>

            {/* proportional bars */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-12 text-slate-400">Earth</span>
                <div className="h-2.5 flex-1 rounded-full bg-space-700">
                  <div className="h-full rounded-full bg-neon-blue" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-12 text-slate-400">Space</span>
                <div className="h-2.5 flex-1 rounded-full bg-space-700">
                  <div className="h-full rounded-full bg-neon-green transition-all" style={{ width: `${ratio * 100}%` }} />
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Space scenario yields <span className="text-slate-300">{formatPercent(c.spaceGrowthPercentage, { digits: 0 })}</span>{' '}
              of the Earth reference over {result.inputs.simulationDays} days on {result.inputs.growingArea} m².
            </p>
          </div>

          {/* factor breakdown */}
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-400">Space growth factors</p>
            <div className="space-y-2">
              {FACTOR_META.map((f) => (
                <FactorBar key={f.key} label={f.label} icon={f.icon} value={result.space.factors[f.key]} />
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-space-700/60 pt-2 text-xs">
                <span className="text-slate-400">Combined multiplier</span>
                <span className="font-mono font-semibold text-slate-100">×{result.space.factors.combined.toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Earth reference multiplier</span>
                <span className="font-mono text-slate-300">×{result.earth.factors.combined.toFixed(3)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}
