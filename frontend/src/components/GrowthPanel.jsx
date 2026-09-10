import { useState } from 'react'
import Panel from './Panel.jsx'
import SegmentedToggle from './SegmentedToggle.jsx'
import GrowthChart from '../charts/GrowthChart.jsx'

const MODES = [
  { value: 'standing', label: 'Standing biomass' },
  { value: 'cumulative', label: 'Cumulative yield' },
]

export default function GrowthPanel({ result }) {
  const [mode, setMode] = useState('standing')

  return (
    <Panel
      title="Crop growth"
      subtitle="Biomass over time, Earth reference vs your space scenario"
      action={<SegmentedToggle options={MODES} value={mode} onChange={setMode} ariaLabel="Growth chart mode" />}
    >
      {result ? (
        <GrowthChart data={result.dailyGrowthData} mode={mode} cycleLengthDays={result.crop.growthDurationDays} />
      ) : (
        <div className="flex h-72 items-center justify-center text-sm text-slate-500">Waiting for simulation…</div>
      )}
    </Panel>
  )
}
