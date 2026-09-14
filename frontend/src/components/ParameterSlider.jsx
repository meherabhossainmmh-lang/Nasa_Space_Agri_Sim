import { useId } from 'react'
import ScenarioSelector from './ScenarioSelector.jsx'
import { formatNumber } from '../services/formatters.js'

const ACCENTS = {
  cyan: '#22d3ee',
  green: '#4ade80',
  blue: '#60a5fa',
  amber: '#fbbf24',
  rose: '#f87171',
  purple: '#c084fc',
  teal: '#2dd4bf',
}

/**
 * One mission parameter: label, live value with unit, slider, optional
 * scenario presets and a one-line explanation of what the model does with it.
 */
export default function ParameterSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  presets = [],
  presetNote,
  hint,
  accent = 'cyan',
  onChange,
  flag,
}) {
  const hintId = useId()
  const color = ACCENTS[accent] ?? ACCENTS.cyan
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : 2
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-medium text-slate-200">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {flag && (
            <span className={`font-mono text-[10px] tracking-wider ${flag.tone === 'warn' ? 'text-warn' : 'text-slate-500'}`}>
              {flag.text}
            </span>
          )}
          <output
            htmlFor={id}
            className="rounded border border-line-strong bg-space-800 px-2 py-0.5 font-mono text-xs tabular-nums text-slate-100"
          >
            {formatNumber(value, decimals)} <span className="text-slate-400">{unit}</span>
          </output>
        </div>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`${label}, ${unit}`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${formatNumber(value, decimals)} ${unit}`}
        aria-describedby={hint ? hintId : undefined}
        className="slider w-full"
        style={{
          background: `linear-gradient(to right, ${color} ${percent}%, var(--color-space-700) ${percent}%)`,
        }}
      />

      {presets.length > 0 && (
        <ScenarioSelector presets={presets} value={value} step={step} note={presetNote} onSelect={onChange} />
      )}

      {hint && (
        <p id={hintId} className="text-[11px] leading-snug text-slate-500">
          {hint}
        </p>
      )}
    </div>
  )
}
