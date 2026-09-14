import { formatDays, formatNumber } from '../services/formatters.js'

/**
 * Compact hero strip: what the scenario is, in four cells.
 * Reads only from the current params and the config (preset labels), so it
 * updates instantly while the simulation itself is still running.
 */
export default function MissionOverview({ params, config, result }) {
  const crop = config.crops.find((c) => c.key === params.crop)
  const gravityLabel = nearestPreset(config.gravityPresets, params.gravity, 0.02)
  const radiationLabel = nearestPreset(config.radiationPresets, params.radiation, 0.015)
  const cycleDays = result?.crop?.growthDurationDays ?? crop?.growthDurationDays

  const cells = [
    {
      label: 'Crop',
      value: crop?.name ?? params.crop,
      detail: cycleDays ? `${cycleDays}-day cycle` : '',
    },
    {
      label: 'Environment',
      value: gravityLabel ?? `${formatNumber(params.gravity, 2)} g`,
      detail: `${formatNumber(params.gravity, 2)} g gravity`,
    },
    {
      label: 'Radiation',
      value: radiationLabel ?? `${formatNumber(params.radiation, 2)} mGy/day`,
      detail: `${formatNumber(params.radiation, 2)} mGy/day`,
    },
    {
      label: 'Duration',
      value: formatDays(params.simulationDays),
      detail: `${formatNumber(params.growingArea, 1)} m² growing area`,
    },
  ]

  return (
    <section
      aria-label="Mission overview"
      className="rounded-lg border border-line bg-gradient-to-r from-space-900/90 via-space-900/70 to-space-800/60"
    >
      <div className="flex flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="label-tech">Mission overview</p>
          <h1 className="mt-0.5 text-base font-semibold text-slate-100 sm:text-lg">
            Crop growth &amp; life-support response in a space environment
          </h1>
          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-400">
            Set the scenario in Mission Controls; the model recomputes growth, the water loop and gas exchange and
            compares the result against an Earth reference run.
          </p>
        </div>
        <dl className="grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
          {cells.map((cell) => (
            <div key={cell.label} className="bg-space-900/90 px-3 py-2 min-w-[7.5rem]">
              <dt className="label-tech">{cell.label}</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-slate-100">{cell.value}</dd>
              {cell.detail && <dd className="truncate font-mono text-[10px] text-slate-500">{cell.detail}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/** Label of the preset whose value is within `tolerance` of the current value. */
function nearestPreset(presets = [], value, tolerance) {
  const hit = presets.find((p) => Math.abs(p.value - value) <= tolerance)
  return hit ? hit.label : null
}
