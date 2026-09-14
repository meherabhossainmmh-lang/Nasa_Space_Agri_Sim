/**
 * Row of scenario chips under a slider ("Moon-like", "Mars-like", ...).
 * Each chip carries a native tooltip with the preset description plus the
 * reminder that these are Phase 1 reference points, not mission data.
 */
export default function ScenarioSelector({ presets, value, step, note, onSelect }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Scenario presets">
      {presets.map((preset) => {
        const active = Math.abs(preset.value - value) < step / 2
        const tooltip = [preset.description, note].filter(Boolean).join(' — ')
        return (
          <button
            key={preset.label}
            type="button"
            title={tooltip}
            aria-pressed={active}
            onClick={() => onSelect(preset.value)}
            className={`rounded border px-2 py-0.5 font-mono text-[10px] tracking-wide transition-colors ${
              active
                ? 'border-accent/60 bg-accent/10 text-accent'
                : 'border-line-strong text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            {preset.label}
          </button>
        )
      })}
      {note && (
        <span className="ml-auto cursor-help font-mono text-[10px] text-slate-600" title={note} aria-label={note}>
          assumed
        </span>
      )}
    </div>
  )
}
