/**
 * Segmented control for the simulation length. When the window is shorter
 * than the crop cycle it says so, because that is exactly the case where
 * "yield" would otherwise be misread.
 */
export default function DurationSelector({ options, value, cycleLengthDays, onChange }) {
  const noHarvest = cycleLengthDays && value < cycleLengthDays
  const cycles = cycleLengthDays ? Math.floor(value / cycleLengthDays) : 0

  return (
    <div>
      <div className="grid grid-cols-5 gap-1 rounded-md border border-line-strong bg-space-800/60 p-1" role="radiogroup" aria-label="Simulation duration">
        {options.map((days) => {
          const selected = days === value
          return (
            <button
              key={days}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(days)}
              className={`rounded px-1 py-1.5 font-mono text-xs transition-colors ${
                selected ? 'bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgba(34,211,238,0.5)]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {days}d
            </button>
          )
        })}
      </div>
      {cycleLengthDays && (
        <p className={`mt-1.5 text-[11px] leading-snug ${noHarvest ? 'text-warn/90' : 'text-slate-500'}`}>
          {noHarvest
            ? `Shorter than the ${cycleLengthDays}-day crop cycle: no harvest inside the window, results show standing biomass.`
            : `${cycles} full ${cycles === 1 ? 'harvest' : 'harvests'} inside the window (${cycleLengthDays}-day cycle).`}
        </p>
      )}
    </div>
  )
}
