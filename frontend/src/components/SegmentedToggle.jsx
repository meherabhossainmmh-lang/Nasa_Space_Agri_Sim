/**
 * Tiny two-or-more-way toggle used in panel headers (e.g. daily / cumulative).
 */
export default function SegmentedToggle({ options, value, onChange, ariaLabel }) {
  return (
    <div className="flex rounded-lg border border-space-700 bg-space-800/60 p-0.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              selected ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
