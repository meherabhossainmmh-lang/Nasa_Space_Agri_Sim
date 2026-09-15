import { formatDay } from '../services/formatters.js'

/**
 * Horizontal mission timeline: planting → harvests inside the window →
 * end of simulation → next harvest. Built only from `result.harvest`.
 */
export default function MissionTimeline({ harvest }) {
  if (!harvest) return null
  const end = harvest.simulationDays
  const span = Math.max(harvest.nextHarvestDay, end)

  const events = [
    { day: 0, label: 'Planting', kind: 'start' },
    ...harvest.harvestDays.map((d, i) => ({ day: d, label: `Harvest ${i + 1}`, kind: 'harvest' })),
    { day: end, label: 'Simulation ends', kind: 'end' },
  ]
  if (harvest.nextHarvestDay > end) events.push({ day: harvest.nextHarvestDay, label: 'Next harvest', kind: 'next' })
  events.sort((a, b) => a.day - b.day)

  // keep labels readable: alternate above/below when events are close
  const pos = (day) => `${(day / span) * 100}%`

  return (
    <div aria-label="Mission timeline" role="group">
      <div className="flex items-baseline justify-between">
        <p className="label-tech">Mission timeline</p>
        <p className="font-mono text-[10px] text-slate-500">
          {harvest.cycleLengthDays}-day cycle · window {formatDay(end)}
        </p>
      </div>
      <div className="relative mb-9 mt-9 h-1 rounded bg-space-700">
        {/* simulated portion */}
        <div className="absolute left-0 top-0 h-full rounded bg-accent/60" style={{ width: pos(end) }} />
        {/* unsimulated tail to the next harvest */}
        {harvest.nextHarvestDay > end && (
          <div
            className="absolute top-0 h-full rounded border-t border-dashed border-slate-500"
            style={{ left: pos(end), width: `${((harvest.nextHarvestDay - end) / span) * 100}%` }}
          />
        )}
        {events.map((e, i) => {
          const above = i % 2 === 1
          // keep the first and last labels inside the track instead of centring them on the dot
          const align = e.day === 0 ? 'left-0 text-left' : e.day === span ? 'right-0 text-right' : 'left-1/2 -translate-x-1/2 text-center'
          const dot =
            e.kind === 'harvest' ? 'bg-growth' : e.kind === 'next' ? 'border border-slate-400 bg-space-900' : e.kind === 'end' ? 'bg-accent' : 'bg-slate-300'
          return (
            <div key={`${e.kind}-${e.day}`} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pos(e.day) }}>
              <span className={`block h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden="true" />
              <span
                className={`absolute whitespace-nowrap font-mono text-[10px] leading-tight ${align} ${above ? 'bottom-4' : 'top-4'} ${
                  e.kind === 'next' ? 'text-slate-500' : 'text-slate-300'
                }`}
              >
                {formatDay(e.day)}
                <br />
                <span className="text-slate-500">{e.label}</span>
              </span>
            </div>
          )
        })}
      </div>
      <ul className="sr-only">
        {events.map((e) => (
          <li key={`${e.kind}-${e.day}-sr`}>
            {formatDay(e.day)}: {e.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
