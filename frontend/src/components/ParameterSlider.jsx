import { formatNumber } from '../services/formatters.js'

/**
 * Range slider that always shows its current value and unit.
 * Optional presets render as small chips below the track.
 */
export default function ParameterSlider({
  id,
  label,
  icon,
  value,
  min,
  max,
  step,
  unit,
  presets = [],
  hint,
  accent = 'cyan',
  onChange,
}) {
  const accentClasses = {
    cyan: 'accent-cyan-400',
    green: 'accent-green-400',
    blue: 'accent-blue-400',
    amber: 'accent-amber-400',
    rose: 'accent-rose-400',
    purple: 'accent-violet-400',
  }
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : 2
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0

  const handleInput = (event) => onChange(Number(event.target.value))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-1.5 text-sm text-slate-300">
          {icon && <span aria-hidden="true">{icon}</span>}
          {label}
        </label>
        <output
          htmlFor={id}
          className="rounded-md border border-space-600 bg-space-800 px-2 py-0.5 font-mono text-xs text-slate-100 tabular-nums"
        >
          {formatNumber(value, decimals)} {unit}
        </output>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleInput}
        aria-valuetext={`${formatNumber(value, decimals)} ${unit}`}
        className={`h-1.5 w-full cursor-pointer appearance-none rounded-full bg-space-700 ${accentClasses[accent] ?? accentClasses.cyan}`}
        style={{
          background: `linear-gradient(to right, currentColor ${percent}%, var(--color-space-700) ${percent}%)`,
        }}
      />

      {(presets.length > 0 || hint) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((preset) => {
            const active = Math.abs(preset.value - value) < step / 2
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.value)}
                className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                  active
                    ? 'border-neon-cyan/70 bg-neon-cyan/10 text-neon-cyan'
                    : 'border-space-600 text-slate-400 hover:border-space-600 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            )
          })}
          {hint && <span className="ml-auto text-[11px] text-slate-500">{hint}</span>}
        </div>
      )}
    </div>
  )
}
