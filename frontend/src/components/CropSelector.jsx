/**
 * Crop picker rendered as a row of selectable cards.
 * Shows the cycle length so the user can relate it to the simulation window.
 */
export default function CropSelector({ crops, value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Crop">
      {crops.map((crop) => {
        const selected = crop.key === value
        return (
          <button
            key={crop.key}
            type="button"
            role="radio"
            aria-checked={selected}
            title={crop.description}
            onClick={() => onChange(crop.key)}
            className={`flex flex-col items-start rounded-md border px-2.5 py-2 text-left transition-colors ${
              selected
                ? 'border-growth/60 bg-growth/10'
                : 'border-line-strong bg-space-800/60 hover:border-slate-500 hover:bg-space-800'
            }`}
          >
            <span className={`text-sm font-semibold ${selected ? 'text-growth' : 'text-slate-200'}`}>{crop.name}</span>
            <span className="mt-0.5 font-mono text-[10px] text-slate-500">{crop.growthDurationDays}-day cycle</span>
          </button>
        )
      })}
    </div>
  )
}
