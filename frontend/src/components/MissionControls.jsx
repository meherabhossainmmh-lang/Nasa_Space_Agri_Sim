import { useState } from 'react'
import Panel from './Panel.jsx'
import CropSelector from './CropSelector.jsx'
import ControlGroup from './ControlGroup.jsx'
import ParameterSlider from './ParameterSlider.jsx'
import DurationSelector from './DurationSelector.jsx'

/**
 * Everything the user can change, grouped CROP / ENVIRONMENT / RESOURCES /
 * SIMULATION. Each control just calls `onChange(name, value)`; ranges,
 * defaults and presets come from the backend config.
 *
 * On small screens the panel collapses to a summary bar with a toggle so the
 * results stay reachable without scrolling past every slider.
 */
export default function MissionControls({ config, params, onChange, onReset, isLoading }) {
  const p = config.parameters
  const crop = config.crops.find((c) => c.key === params.crop)
  const [openOnMobile, setOpenOnMobile] = useState(false)

  const lowWater = params.waterAvailability < 100
  const highRadiation = params.radiation >= 1.0
  const zeroArea = params.growingArea <= 0

  return (
    <Panel
      id="mission-controls"
      eyebrow="01"
      title="Mission controls"
      subtitle="Set the scenario · results update as you move a slider"
      className="lg:max-h-[calc(100vh-88px)] lg:overflow-hidden lg:flex lg:flex-col"
      bodyClassName="lg:min-h-0 lg:flex-1 lg:overflow-y-auto scroll-thin"
      padded={false}
      action={
        <>
          <button
            type="button"
            onClick={onReset}
            className="rounded border border-line-strong px-2.5 py-1 font-mono text-[10px] tracking-wider text-slate-300 transition-colors hover:border-accent/60 hover:text-accent"
          >
            RESET
          </button>
          <button
            type="button"
            onClick={() => setOpenOnMobile((v) => !v)}
            aria-expanded={openOnMobile}
            aria-controls="mission-controls-body"
            className="rounded border border-line-strong px-2.5 py-1 font-mono text-[10px] tracking-wider text-slate-300 transition-colors hover:border-accent/60 hover:text-accent lg:hidden"
          >
            {openOnMobile ? 'HIDE' : 'ADJUST'}
          </button>
        </>
      }
    >
      {/* compact summary shown on small screens while the controls are collapsed */}
      <div className={`px-4 py-3 font-mono text-[11px] text-slate-400 lg:hidden ${openOnMobile ? 'hidden' : ''}`}>
        {crop?.name} · {params.gravity} g · {params.radiation} mGy/day · {params.waterAvailability}% water · {params.lightHours} h ·{' '}
        {params.co2Level} ppm · {params.growingArea} m² · {params.simulationDays} d
      </div>

      <div id="mission-controls-body" className={`space-y-5 p-4 sm:p-5 ${openOnMobile ? '' : 'max-lg:hidden'}`}>
        <ControlGroup index="A" title="Crop">
          <CropSelector crops={config.crops} value={params.crop} onChange={(key) => onChange('crop', key)} />
        </ControlGroup>

        <ControlGroup index="B" title="Environment" description="space-specific drivers">
          <ParameterSlider
            id="gravity"
            label="Gravity"
            accent="purple"
            value={params.gravity}
            {...p.gravity}
            presets={config.gravityPresets}
            presetNote={config.presetNote}
            hint="Below 1 g the model applies a linear growth penalty scaled by crop sensitivity; above 1 g a smaller one."
            onChange={(v) => onChange('gravity', v)}
          />
          <ParameterSlider
            id="radiation"
            label="Radiation dose rate"
            accent="rose"
            value={params.radiation}
            {...p.radiation}
            presets={config.radiationPresets}
            presetNote={config.presetNote}
            hint="Chronic dose above Earth background reduces growth exponentially (assumed steepness, see model assumptions)."
            flag={highRadiation ? { text: 'HIGH DOSE', tone: 'warn' } : undefined}
            onChange={(v) => onChange('radiation', v)}
          />
        </ControlGroup>

        <ControlGroup index="C" title="Resources" description="shared by both runs in matched mode">
          <ParameterSlider
            id="waterAvailability"
            label="Water availability"
            accent="blue"
            value={params.waterAvailability}
            {...p.waterAvailability}
            hint="Share of the crop's water demand the system can supply. Anything below 100 % becomes a water deficit."
            flag={lowWater ? { text: 'DEFICIT', tone: 'warn' } : undefined}
            onChange={(v) => onChange('waterAvailability', v)}
          />
          <ParameterSlider
            id="lightHours"
            label="Photoperiod"
            accent="amber"
            value={params.lightHours}
            {...p.lightHours}
            hint={`Saturating response, normalised to the crop optimum${crop?.optimalLightHours ? ` (${crop.optimalLightHours} h)` : ''}; hours beyond it cost a little.`}
            onChange={(v) => onChange('lightHours', v)}
          />
          <ParameterSlider
            id="co2Level"
            label="CO₂ concentration"
            accent="green"
            value={params.co2Level}
            {...p.co2Level}
            hint="Earth ambient ≈ 420 ppm gives ×1.00; enrichment boosts growth with diminishing returns."
            onChange={(v) => onChange('co2Level', v)}
          />
          <ParameterSlider
            id="growingArea"
            label="Growing area"
            accent="teal"
            value={params.growingArea}
            {...p.growingArea}
            hint="Scales biomass, water and gas exchange linearly."
            flag={zeroArea ? { text: 'NO AREA', tone: 'warn' } : undefined}
            onChange={(v) => onChange('growingArea', v)}
          />
        </ControlGroup>

        <ControlGroup index="D" title="Simulation">
          <DurationSelector
            options={config.durationOptions}
            value={params.simulationDays}
            cycleLengthDays={crop?.growthDurationDays}
            onChange={(days) => onChange('simulationDays', days)}
          />
          <p className="font-mono text-[10px] tracking-wider text-slate-500" aria-live="polite">
            {isLoading ? 'SIMULATING…' : 'MODEL IN SYNC WITH CONTROLS'}
          </p>
        </ControlGroup>
      </div>
    </Panel>
  )
}
