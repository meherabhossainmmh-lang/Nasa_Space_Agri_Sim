import Panel from './Panel.jsx'
import CropSelector from './CropSelector.jsx'
import ControlGroup from './ControlGroup.jsx'
import ParameterSlider from './ParameterSlider.jsx'
import DurationSelector from './DurationSelector.jsx'

/**
 * Left-hand column: everything the user can change.
 * Each control just calls `onChange(name, value)`; ranges come from the backend config.
 */
export default function ControlPanel({ config, params, onChange, onReset }) {
  const p = config.parameters

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
      <div className="space-y-7">
        <CropSelector crops={config.crops} value={params.crop} onChange={(key) => onChange('crop', key)} />

        <ControlGroup title="Space environment">
          <ParameterSlider
            id="gravity"
            label="Gravity"
            icon="🪐"
            accent="purple"
            value={params.gravity}
            {...p.gravity}
            presets={config.gravityPresets}
            onChange={(v) => onChange('gravity', v)}
          />
          <ParameterSlider
            id="radiation"
            label="Radiation level"
            icon="☢️"
            accent="rose"
            value={params.radiation}
            {...p.radiation}
            presets={config.radiationPresets}
            onChange={(v) => onChange('radiation', v)}
          />
        </ControlGroup>

        <ControlGroup title="Resources">
          <ParameterSlider
            id="waterAvailability"
            label="Water availability"
            icon="💧"
            accent="blue"
            value={params.waterAvailability}
            {...p.waterAvailability}
            onChange={(v) => onChange('waterAvailability', v)}
          />
          <ParameterSlider
            id="lightHours"
            label="Light hours / day"
            icon="☀️"
            accent="amber"
            value={params.lightHours}
            {...p.lightHours}
            onChange={(v) => onChange('lightHours', v)}
          />
          <ParameterSlider
            id="co2Level"
            label="CO₂ level"
            icon="💨"
            accent="green"
            value={params.co2Level}
            {...p.co2Level}
            hint="Earth ambient ≈ 420 ppm"
            onChange={(v) => onChange('co2Level', v)}
          />
          <ParameterSlider
            id="growingArea"
            label="Growing area"
            icon="📐"
            accent="cyan"
            value={params.growingArea}
            {...p.growingArea}
            onChange={(v) => onChange('growingArea', v)}
          />
        </ControlGroup>

        <DurationSelector
          options={config.durationOptions}
          value={params.simulationDays}
          onChange={(days) => onChange('simulationDays', days)}
        />
      </div>
    </Panel>
  )
}
