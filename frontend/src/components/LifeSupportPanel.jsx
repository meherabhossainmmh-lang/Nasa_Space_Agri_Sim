import { useState } from 'react'
import Panel from './Panel.jsx'
import SegmentedToggle from './SegmentedToggle.jsx'
import LifeSupportChart from '../charts/LifeSupportChart.jsx'
import { CHART_COLORS } from '../charts/chartTheme.js'

const MODES = [
  { value: 'daily', label: 'Per day' },
  { value: 'cumulative', label: 'Cumulative' },
]

const SERIES_TOGGLES = [
  { key: 'waterUsed', label: 'Water used', color: CHART_COLORS.waterUsed },
  { key: 'waterRecovered', label: 'Water recovered', color: CHART_COLORS.waterRecovered },
  { key: 'co2', label: 'CO₂ removed', color: CHART_COLORS.co2 },
  { key: 'o2', label: 'O₂ produced', color: CHART_COLORS.o2 },
]

export default function LifeSupportPanel({ result }) {
  const [mode, setMode] = useState('daily')
  const [visible, setVisible] = useState({ waterUsed: true, waterRecovered: true, co2: true, o2: true })

  const toggle = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }))

  return (
    <Panel
      title="Life support"
      subtitle="Water loop and atmosphere revitalisation for the space scenario"
      action={<SegmentedToggle options={MODES} value={mode} onChange={setMode} ariaLabel="Life support chart mode" />}
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {SERIES_TOGGLES.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={visible[s.key]}
            onClick={() => toggle(s.key)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] transition ${
              visible[s.key] ? 'border-space-600 text-slate-200' : 'border-space-700 text-slate-500 line-through'
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: s.color, opacity: visible[s.key] ? 1 : 0.3 }} />
            {s.label}
          </button>
        ))}
      </div>
      {result ? (
        <LifeSupportChart data={result.dailyLifeSupportData} mode={mode} visible={visible} />
      ) : (
        <div className="flex h-72 items-center justify-center text-sm text-slate-500">Waiting for simulation…</div>
      )}
    </Panel>
  )
}
