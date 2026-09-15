import { useState } from 'react'
import Panel from './Panel.jsx'
import SegmentedToggle from './SegmentedToggle.jsx'
import GrowthChart from '../charts/GrowthChart.jsx'
import MissionTimeline from './MissionTimeline.jsx'
import { formatDay, formatMass } from '../services/formatters.js'

const MODES = [
  { value: 'standing', label: 'Standing biomass' },
  { value: 'harvested', label: 'Harvested yield' },
  { value: 'total', label: 'Total produced' },
]

const MODE_HELP = {
  standing: 'Biomass currently growing in the chamber. It drops after each harvest when the next cycle is planted.',
  harvested: 'Cumulative harvested yield. It steps up on harvest days and stays flat while the next cycle grows.',
  total: 'Standing biomass plus everything harvested so far - the total the crop has produced.',
}

/**
 * GROWTH panel: Earth vs space biomass curves, harvest markers, current-day
 * marker, an explicit no-harvest notice and the mission timeline.
 */
export default function GrowthPanel({ result }) {
  const [mode, setMode] = useState('standing')
  const harvest = result?.harvest

  return (
    <Panel
      id="crop-growth"
      eyebrow="05"
      title="Crop growth"
      subtitle="Earth reference vs space scenario, day by day"
      action={<SegmentedToggle options={MODES} value={mode} onChange={setMode} ariaLabel="Growth chart series" />}
    >
      {result ? (
        <div className="space-y-4">
          {harvest && !harvest.harvestWithinWindow && (
            <p className="flex flex-wrap items-center gap-x-2 rounded border border-line bg-space-800/60 px-3 py-1.5 font-mono text-[10px] tracking-wider text-warn">
              NO HARVEST YET
              <span className="text-slate-400">· Next harvest: {formatDay(harvest.nextHarvestDay)}</span>
              <span className="text-slate-500">· standing biomass at {formatDay(harvest.simulationDays)}: {formatMass(harvest.standingBiomass)}</span>
            </p>
          )}
          {harvest && harvest.harvestWithinWindow && (
            <p className="flex flex-wrap items-center gap-x-2 rounded border border-line bg-space-800/60 px-3 py-1.5 font-mono text-[10px] tracking-wider text-growth">
              {harvest.cyclesCompleted} {harvest.cyclesCompleted === 1 ? 'HARVEST' : 'HARVESTS'} IN WINDOW
              <span className="text-slate-400">· {formatMass(harvest.harvestedYield)} harvested</span>
              <span className="text-slate-500">· {formatMass(harvest.standingBiomass)} still growing · next harvest {formatDay(harvest.nextHarvestDay)}</span>
            </p>
          )}
          <GrowthChart data={result.dailyGrowthData} mode={mode} harvest={harvest} />
          <p className="text-[11px] leading-snug text-slate-500">{MODE_HELP[mode]}</p>
          <MissionTimeline harvest={harvest} />
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center text-sm text-slate-500">Waiting for simulation…</div>
      )}
    </Panel>
  )
}
