import { handleRadioGroupKeyDown, radioTabIndex } from '../services/a11y.js'

/**
 * Small two-or-more-way toggle used in panel headers (e.g. daily / cumulative).
 */
export default function SegmentedToggle({ options, value, onChange, ariaLabel }) {
  const values = options.map((o) => o.value)
  return (
    <div
      className="flex max-w-full flex-wrap rounded-md border border-line-strong bg-space-800/60 p-0.5"
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={(event) => handleRadioGroupKeyDown(event, values, value, onChange)}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={radioTabIndex(selected)}
            onClick={() => onChange(option.value)}
            className={`whitespace-nowrap rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
              selected ? 'bg-accent/15 text-accent' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
