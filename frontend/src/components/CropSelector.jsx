/**
 * Crop picker rendered as a row of selectable cards.
 */
export default function CropSelector({ crops, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Crop</legend>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Crop">
        {crops.map((crop) => {
          const selected = crop.key === value
          return (
            <button
              key={crop.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(crop.key)}
              className={`group flex flex-col items-center rounded-xl border px-2 py-3 text-center transition
                ${
                  selected
                    ? 'border-neon-green/70 bg-neon-green/10 shadow-[0_0_24px_-8px_rgba(74,222,128,0.6)]'
                    : 'border-space-700 bg-space-800/60 hover:border-space-600 hover:bg-space-800'
                }`}
            >
              <span className="text-2xl leading-none" aria-hidden="true">
                {crop.emoji}
              </span>
              <span className={`mt-2 text-sm font-semibold ${selected ? 'text-neon-green' : 'text-slate-200'}`}>
                {crop.name}
              </span>
              <span className="mt-0.5 text-[11px] text-slate-400">{crop.growthDurationDays} day cycle</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
