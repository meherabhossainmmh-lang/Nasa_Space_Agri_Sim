/**
 * Scope disclaimer - keeps expectations honest about what Phase 1 is.
 */
export default function Footer({ disclaimer }) {
  return (
    <footer className="mx-auto max-w-[1600px] px-4 pb-8 pt-2 text-center text-[11px] leading-relaxed text-slate-500 sm:px-6">
      <p>
        {disclaimer ||
          'Phase 1 mathematical prototype. Outputs are based on documented simulation assumptions, not on validated NASA data or predictions.'}
      </p>
      <p className="mt-1">
        NASA GeneLab / OSDR data integration and machine learning are planned for later phases.
      </p>
    </footer>
  )
}
