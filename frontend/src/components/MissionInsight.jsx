import Panel from './Panel.jsx'
import { changedParameters, missionInsight, whatIfDeltas } from '../services/insights.js'
import { formatPercent } from '../services/formatters.js'

/**
 * MISSION INSIGHT: one plain-language summary sentence generated from the
 * current result, plus a "what changed?" comparison against a pinned
 * baseline result (the user pins the current scenario, then moves a slider).
 */
export default function MissionInsight({ result, params, config, baseline, onPinBaseline, onClearBaseline }) {
  const sentence = missionInsight(result)
  const deltas = whatIfDeltas(baseline?.result, result)
  const changed = changedParameters(baseline?.params, params, config)
  const hasBaseline = Boolean(baseline?.result)

  return (
    <Panel
      id="mission-insight"
      eyebrow="04"
      title="Mission insight"
      subtitle="Generated from the current outputs"
      action={
        <div className="flex items-center gap-2">
          {hasBaseline && (
            <button
              type="button"
              onClick={onClearBaseline}
              className="rounded border border-line-strong px-2.5 py-1 font-mono text-[10px] tracking-wider text-slate-400 transition-colors hover:text-slate-200"
            >
              CLEAR
            </button>
          )}
          <button
            type="button"
            onClick={onPinBaseline}
            disabled={!result}
            className="rounded border border-accent/50 px-2.5 py-1 font-mono text-[10px] tracking-wider text-accent transition-colors hover:bg-accent/10 disabled:opacity-40"
            title="Pin the current scenario as the baseline, then change one parameter to see what it does"
          >
            {hasBaseline ? 'RE-PIN BASELINE' : 'PIN AS BASELINE'}
          </button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-slate-200">{sentence ?? 'Waiting for the first simulation…'}</p>

      <div className="mt-4 border-t border-line pt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="label-tech">What changed?</p>
          {hasBaseline && changed.length > 0 && (
            <p className="font-mono text-[10px] text-slate-500">
              {changed.map((c) => `${c.label} ${c.from} → ${c.to}`).join(' · ')}
            </p>
          )}
        </div>

        {!hasBaseline && (
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            Pin the current scenario, then change a single parameter. The table shows how biomass, O₂, CO₂ removal and the water loop
            respond relative to the pinned baseline.
          </p>
        )}

        {hasBaseline && changed.length === 0 && (
          <p className="mt-1 text-[11px] text-slate-500">Baseline pinned. Move any control to compare against it.</p>
        )}

        {hasBaseline && changed.length > 0 && (
          <table className="mt-2 w-full text-xs">
            <thead>
              <tr className="label-tech text-left">
                <th className="py-1 font-normal">Metric</th>
                <th className="py-1 text-right font-normal">Baseline</th>
                <th className="py-1 text-right font-normal">Current</th>
                <th className="py-1 text-right font-normal">Δ</th>
              </tr>
            </thead>
            <tbody>
              {deltas.map((d) => (
                <tr key={d.key} className="border-t border-line">
                  <td className="py-1.5 text-slate-300">{d.label}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-slate-400">{d.format(d.before)}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-slate-100">{d.format(d.after)}</td>
                  <td
                    className={`py-1.5 text-right font-mono tabular-nums ${
                      d.tone === 'good' ? 'text-growth' : d.tone === 'bad' ? 'text-danger' : 'text-slate-400'
                    }`}
                  >
                    {d.direction === 'same' ? '±0' : d.change == null ? (d.direction === 'up' ? 'new' : 'gone') : formatPercent(d.change, { signed: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  )
}
