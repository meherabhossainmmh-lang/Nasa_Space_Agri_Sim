/**
 * Labelled group of controls inside the control panel.
 */
export default function ControlGroup({ title, children }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">{title}</h3>
      <div className="space-y-5">{children}</div>
    </div>
  )
}
