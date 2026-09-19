import { useState } from 'react'
import Panel from './Panel.jsx'
import SegmentedToggle from './SegmentedToggle.jsx'
import { AtmosphereChart, WaterLoopChart } from '../charts/LifeSupportChart.jsx'
import { formatMass, formatNumber, formatPercent, formatVolume } from '../services/formatters.js'

const MODES = [
  { value: 'daily', label: 'Per day' },
  { value: 'cumulative', label: 'Cumulative' },
]

/**
 * LIFE SUPPORT panel, split into two single-axis views:
 *   WATER LOOP   demand / supplied / deficit / recovered
 *   ATMOSPHERE   CO2 removed / O2 produced
 */
export default function LifeSupportPanel({ result }) {
  const [mode, setMode] = useState('daily')
  const water = result?.lifeSupport?.water
  const ls = result?.lifeSupport

  return (
    <Panel
      id="life-support"
      eyebrow="06"
      title="Life support"
      subtitle="Space scenario · water loop and atmosphere exchange"
      action={<SegmentedToggle options={MODES} value={mode} onChange={setMode} ariaLabel="Life support chart mode" />}
    >
      {!result ? (
        <div className="flex h-72 items-center justify-center text-sm text-slate-500">Waiting for simulation…</div>
      ) : (
        <div className="space-y-6">
          <section aria-labelledby="water-loop-title">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <h3 id="water-loop-title" className="label-tech !text-water">
                Water loop
              </h3>
              <p className="font-mono text-[10px] tabular-nums text-slate-500">
                demand {formatVolume(water.demand)} · supplied {formatVolume(water.supplied)} ·{' '}
                <span className={water.deficit > 0 ? 'text-warn' : ''}>deficit {formatVolume(water.deficit)}</span> · est. recovery{' '}
                {formatVolume(water.recovered)} ({formatNumber(water.recoveryEfficiency * 100, 0)}% assumed)
              </p>
            </div>
            <WaterLoopChart data={result.dailyLifeSupportData} mode={mode} />
            {water.deficit > 0 ? (
              <p className="mt-1 text-[11px] text-warn/90">
                {formatPercent(water.deficitPercent, { digits: 0 })} of the canopy’s demand is unmet. The shortage is already reflected in
                the growth curve through the water factor.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">Demand is fully met; net make-up water after recovery is {formatVolume(water.netConsumed)}.</p>
            )}
          </section>

          <section aria-labelledby="atmosphere-title" className="border-t border-line pt-4">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <h3 id="atmosphere-title" className="label-tech !text-o2">
                Atmosphere
              </h3>
              <p className="font-mono text-[10px] tabular-nums text-slate-500">
                CO₂ removed {formatMass(result.co2Removed)} · O₂ produced {formatMass(result.estimatedOxygenProduced)} · ≈{' '}
                {formatNumber(ls.crewO2DaysSupported, 1)} crew-days O₂ · reference equivalent
              </p>
            </div>
            <AtmosphereChart data={result.dailyLifeSupportData} mode={mode} />
            <p className="mt-1 text-[11px] text-slate-500">
              Gas exchange is derived from daily biomass gain. Crew-day figures are an equivalent reference only; crew metabolism and the
              full atmospheric balance are not modeled.
            </p>
          </section>
        </div>
      )}
    </Panel>
  )
}
