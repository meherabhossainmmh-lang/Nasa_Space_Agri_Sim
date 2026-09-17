import { useState } from 'react'
import Panel from './Panel.jsx'

/**
 * Collapsible MODEL ASSUMPTIONS list plus the MODEL STATUS block.
 * The assumptions are described by the backend (GET /api/config), so the
 * formulas and constants shown here are the ones the engine actually uses.
 */
export default function ModelAssumptions({ assumptions = [], modelStatus, disclaimer }) {
  const [open, setOpen] = useState(false)

  return (
    <Panel
      id="model-assumptions"
      eyebrow="08"
      title="Model assumptions"
      subtitle="Phase 1 response curves and constants, as reported by the simulation engine"
      action={
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="model-assumptions-list"
          className="rounded border border-line-strong px-2.5 py-1 font-mono text-[10px] tracking-wider text-slate-300 transition-colors hover:border-accent/60 hover:text-accent"
        >
          {open ? 'COLLAPSE' : 'EXPAND'}
        </button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {disclaimer ||
              'Phase 1 mathematical prototype. Outputs are based on documented simulation assumptions, not on validated NASA data or predictions.'}
          </p>
          <ul id="model-assumptions-list" className={`mt-3 space-y-2 ${open ? '' : 'hidden'}`}>
            {assumptions.map((a) => (
              <li key={a.key} className="rounded border border-line bg-space-800/50 px-3 py-2">
                <p className="text-xs font-semibold text-slate-200">{a.title}</p>
                <p className="mt-1 break-words font-mono text-[11px] leading-relaxed text-accent/90">{a.formula}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{a.note}</p>
                {a.constants && Object.keys(a.constants).length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] text-slate-500">
                    {Object.entries(a.constants).map(([k, v]) => (
                      <span key={k}>
                        {k} = <span className="text-slate-300">{String(v)}</span>
                      </span>
                    ))}
                  </p>
                )}
              </li>
            ))}
            {assumptions.length === 0 && <li className="text-[11px] text-slate-500">Assumptions load from the backend once it is reachable.</li>}
          </ul>
          {!open && (
            <p className="mt-2 font-mono text-[10px] text-slate-500">
              {assumptions.length} components: {assumptions.map((a) => a.title).join(' · ')}
            </p>
          )}
        </div>

        <aside className="rounded border border-line bg-space-800/50 px-3 py-3" aria-labelledby="model-status-title">
          <p id="model-status-title" className="label-tech">
            Model status
          </p>
          <dl className="mt-2 space-y-2 text-[11px]">
            <StatusRow label="Phase" value={modelStatus?.phase ?? 'Phase 1'} tone="text-accent" />
            <StatusRow label="Type" value={modelStatus?.kind ?? 'Mathematical prototype'} />
            <StatusRow label="Data" value={modelStatus?.dataSource ?? 'Documented simulation assumptions'} />
            <StatusRow label="Validation" value={modelStatus?.validation ?? 'Not yet validated against NASA data'} tone="text-warn" />
          </dl>
          <p className="label-tech mt-3">Planned</p>
          <ul className="mt-1 space-y-1 text-[11px] text-slate-400">
            {(modelStatus?.planned ?? ['NASA GeneLab / OSDR data integration', 'Data-driven calibration of response curves']).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Panel>
  )
}

function StatusRow({ label, value, tone = 'text-slate-200' }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 text-slate-500">{label}</dt>
      <dd className={tone}>{value}</dd>
    </div>
  )
}
