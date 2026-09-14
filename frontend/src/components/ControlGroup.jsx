/**
 * Labelled group of controls inside the mission controls panel
 * (CROP / ENVIRONMENT / RESOURCES / SIMULATION).
 */
export default function ControlGroup({ index, title, description, children }) {
  return (
    <fieldset className="min-w-0 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <legend className="float-left mb-2 flex w-full items-baseline gap-2">
        {index && <span className="font-mono text-[10px] text-slate-600">{index}</span>}
        <span className="label-tech !text-slate-300">{title}</span>
        {description && <span className="ml-auto truncate text-[10px] text-slate-600">{description}</span>}
      </legend>
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  )
}
