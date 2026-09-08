import Panel from './Panel.jsx'
import CropSelector from './CropSelector.jsx'

/**
 * Left-hand column: everything the user can change.
 * Controls are added group by group; each one just calls `onChange(name, value)`.
 */
export default function ControlPanel({ config, params, onChange, onReset }) {
  return (
    <Panel
      title="Mission controls"
      subtitle="Adjust the environment and watch the results update"
      action={
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-space-600 px-2.5 py-1 text-xs text-slate-300 transition hover:border-neon-cyan/60 hover:text-neon-cyan"
        >
          Reset
        </button>
      }
    >
      <div className="space-y-6">
        <CropSelector crops={config.crops} value={params.crop} onChange={(key) => onChange('crop', key)} />
      </div>
    </Panel>
  )
}
