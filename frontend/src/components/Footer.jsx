/**
 * Scope disclaimer - keeps expectations honest about what Phase 1 is.
 */
export default function Footer({ disclaimer }) {
  return (
    <footer className="mx-auto max-w-[1600px] px-4 pb-8 pt-2 text-[11px] leading-relaxed text-slate-500 sm:px-6">
      <div className="flex flex-col gap-1 border-t border-line pt-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-3xl">
          {disclaimer ||
            'Phase 1 mathematical prototype. Outputs are based on documented simulation assumptions, not on validated NASA data or predictions.'}{' '}
          Roadmap: Phase 2 NASA GeneLab / OSDR data integration &amp; calibration · Phase 3 ML / model fitting · Phase 4 full mission digital twin.
        </p>
        <p className="shrink-0 font-mono text-[10px] tracking-wider text-slate-500">SPACEAGRISIM · PHASE 1</p>
      </div>
    </footer>
  )
}
