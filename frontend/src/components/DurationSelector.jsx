/**
 * Segmented control for the simulation length.
 */
export default function DurationSelector({ options, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
        Simulation duration
      </legend>
      <div className="grid grid-cols-5 gap-1 rounded-xl border border-space-700 bg-space-800/60 p-1" role="radiogroup">
        {options.map((days) => {
          const selected = days === value
          return (
            <button
              key={days}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(days)}
              className={`rounded-lg px-1 py-1.5 text-xs font-medium transition ${
                selected
                  ? 'bg-neon-cyan/15 text-neon-cyan shadow-[inset_0_0_0_1px_rgba(34,211,238,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {days}d
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
