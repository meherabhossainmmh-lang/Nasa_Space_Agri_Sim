import Panel from './Panel.jsx'
import MetricCard from './MetricCard.jsx'
import { formatDay, formatMass, formatNumber, formatPercent, formatVolume } from '../services/formatters.js'

/**
 * MISSION SNAPSHOT - the headline result of the space scenario.
 *
 * Hierarchy:
 *   1. biomass / harvest (large) - standing biomass vs harvested yield are
 *      deliberately separate numbers so an unfinished cycle is never read
 *      as a harvest
 *   2. water loop and atmosphere (secondary row)
 * All values come straight from the API response.
 */
export default function MetricSummary({ result, isLoading }) {
  const r = result
  const harvest = r?.harvest
  const water = r?.lifeSupport?.water
  const comparison = r?.comparison
  const days = r?.inputs?.simulationDays
  const cropName = r?.crop?.name?.toLowerCase()

  const diff = comparison?.differencePercent
  const comparisonDefined = comparison?.isDefined !== false
  const diffTone = !comparisonDefined || diff == null ? 'muted' : diff < -0.05 ? 'danger' : diff > 0.05 ? 'growth' : 'muted'

  const noHarvest = harvest && !harvest.harvestWithinWindow
  const zeroOutput = r && r.cropYield <= 0
  const primaryLabel = zeroOutput
    ? 'Total biomass'
    : noHarvest
      ? `Standing biomass · unharvested · ${formatDay(days)}`
      : `Total biomass produced · ${formatDay(days)}`

  return (
    <Panel id="mission-snapshot" eyebrow="02" title="Mission snapshot" subtitle="Space scenario totals over the simulation window" padded={false}>
      {/* primary: biomass & harvest */}
      <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="label-tech">Space scenario · {primaryLabel}</p>
          <p className={`mt-1 font-mono text-5xl font-semibold leading-none tabular-nums tracking-tight text-growth transition-opacity sm:text-6xl ${isLoading ? 'opacity-60' : ''}`}>
            {r ? formatMass(r.cropYield) : '–'}
          </p>
          {/* the comparison is the headline judgement, so it sits directly under the number at the same visual level */}
          {r && comparisonDefined && (
            <dl className={`mt-3 flex flex-wrap gap-x-6 gap-y-2 transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
              <HeadlineStat label="of Earth reference" value={formatPercent(comparison.spaceGrowthPercentage, { digits: 0 })} tone="text-slate-100" />
              <HeadlineStat
                label="vs Earth"
                value={formatPercent(diff, { signed: true })}
                tone={diffTone === 'danger' ? 'text-danger' : diffTone === 'growth' ? 'text-growth' : 'text-slate-300'}
              />
              <HeadlineStat label="Earth reference" value={formatMass(comparison.earthYield)} tone="text-slate-300" />
            </dl>
          )}
          {r && !comparisonDefined && <p className="mt-3 font-mono text-xs text-slate-500">Earth reference produced no biomass · comparison not defined</p>}
          <p className="mt-2 text-[11px] text-slate-500">
            {r ? `${formatNumber(r.growthRate, 1)} g/day average · ${formatNumber(r.inputs.growingArea, 1)} m² growing area` : 'Waiting for the first simulation…'}
          </p>

          {noHarvest && !zeroOutput && (
            <div className="mt-3 flex items-start gap-2 rounded border border-warn/40 bg-warn/5 px-3 py-2" role="note">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" aria-hidden="true" />
              <p className="text-[11px] leading-snug text-warn/90">
                <span className="font-mono tracking-wider">NO HARVEST WITHIN SIMULATION WINDOW</span>
                <span className="text-warn/70">
                  {' '}— simulation ends {formatDay(days)}, {cropName} harvest cycle {formatDay(harvest.cycleLengthDays)}. The biomass above is still growing and has not been harvested.
                </span>
              </p>
            </div>
          )}
          {zeroOutput && (
            <div className="mt-3 flex items-start gap-2 rounded border border-danger/40 bg-danger/5 px-3 py-2" role="note">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" aria-hidden="true" />
              <p className="text-[11px] leading-snug text-danger/90">
                <span className="font-mono tracking-wider">NO GROWTH</span>
                <span className="text-danger/70"> — at least one driver (water, light or area) is zero, so the crop produces nothing.</span>
              </p>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-2 self-start">
          <HarvestCell
            label="Harvested yield"
            value={r ? formatMass(harvest.lastHarvestYield) : '–'}
            note={r ? (harvest.lastHarvestDay != null ? `last harvest ${formatDay(harvest.lastHarvestDay)}` : 'none inside window') : ''}
            tone={r && harvest.lastHarvestYield > 0 ? 'text-growth' : 'text-slate-400'}
            isLoading={isLoading}
          />
          <HarvestCell
            label="Cumulative harvest"
            value={r ? formatMass(harvest.harvestedYield) : '–'}
            note={r ? (harvest.harvestDays.length ? `${harvest.cyclesCompleted} ${harvest.cyclesCompleted === 1 ? 'harvest' : 'harvests'} · days ${harvest.harvestDays.join(', ')}` : 'no harvest days yet') : ''}
            tone={r && harvest.harvestedYield > 0 ? 'text-slate-100' : 'text-slate-400'}
            isLoading={isLoading}
          />
          <HarvestCell
            label="Next harvest"
            value={r ? formatDay(harvest.nextHarvestDay) : '–'}
            note={r ? `${harvest.daysUntilNextHarvest} ${harvest.daysUntilNextHarvest === 1 ? 'day' : 'days'} after window ends` : ''}
            tone="text-accent"
            isLoading={isLoading}
          />
          <HarvestCell
            label="Potential harvest"
            value={r ? formatMass(harvest.potentialHarvest) : '–'}
            note={r ? `one ${harvest.cycleLengthDays}-day cycle, these conditions` : ''}
            tone="text-slate-100"
            isLoading={isLoading}
          />
        </dl>
      </div>

      {/* secondary: water loop and atmosphere */}
      <div className="grid grid-cols-2 gap-2 border-t border-line px-4 py-3 sm:px-5 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          size="sm"
          label="Water demand"
          tone="water"
          value={r ? formatVolume(water.demand) : '–'}
          note={r ? `${formatNumber(water.demand / Math.max(days, 1), 1)} L/day avg` : undefined}
          isLoading={isLoading}
        />
        <MetricCard
          size="sm"
          label="Water supplied"
          tone="water"
          value={r ? formatVolume(water.supplied) : '–'}
          note={r ? `${formatNumber(r.inputs.waterAvailability, 0)}% of demand` : undefined}
          isLoading={isLoading}
        />
        <MetricCard
          size="sm"
          label="Water deficit"
          tone={r && water.deficit > 0 ? 'warn' : 'muted'}
          value={r ? formatVolume(water.deficit) : '–'}
          note={r ? (water.deficit > 0 ? `${formatPercent(water.deficitPercent, { digits: 0 })} of demand unmet` : 'demand fully met') : undefined}
          noteTone={r && water.deficit > 0 ? 'warn' : 'muted'}
          isLoading={isLoading}
        />
        <MetricCard
          size="sm"
          label="Water recovered"
          tone="accent"
          value={r ? formatVolume(water.recovered) : '–'}
          note={r ? `estimate · ${formatNumber(water.recoveryEfficiency * 100, 0)}% assumed recovery` : undefined}
          title="Estimated water recovery: share of the supplied water captured again as condensate (assumed closed-loop efficiency)"
          isLoading={isLoading}
        />
        <MetricCard
          size="sm"
          label="Est. CO₂ removal"
          tone="co2"
          value={r ? formatMass(r.co2Removed) : '–'}
          note={r ? `≈ ${formatNumber(r.lifeSupport.crewCo2DaysRemoved, 1)} crew-days CO₂ eq.` : undefined}
          title="Equivalent reference only; crew metabolism and full atmospheric balance are not modeled."
          isLoading={isLoading}
        />
        <MetricCard
          size="sm"
          label="O₂ production"
          tone="o2"
          value={r ? formatMass(r.estimatedOxygenProduced) : '–'}
          note={r ? `≈ ${formatNumber(r.lifeSupport.crewO2DaysSupported, 1)} crew-days O₂ eq.` : undefined}
          title="Equivalent reference only; crew metabolism and full atmospheric balance are not modeled."
          isLoading={isLoading}
        />
      </div>
      <p className="border-t border-line px-4 py-2 text-[10px] leading-snug text-slate-500 sm:px-5">
        Crew-day figures are an equivalent reference only; crew metabolism and the full atmospheric balance are not modeled.
        Water recovery uses an assumed closed-loop efficiency.
      </p>
    </Panel>
  )
}

function HeadlineStat({ label, value, tone }) {
  return (
    <div className="min-w-0">
      <dd className={`font-mono text-xl font-semibold tabular-nums sm:text-2xl ${tone}`}>{value}</dd>
      <dt className="label-tech">{label}</dt>
    </div>
  )
}

function HarvestCell({ label, value, note, tone, isLoading }) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-space-800/50 px-3 py-2">
      <dt className="label-tech leading-tight">{label}</dt>
      <dd className={`mt-0.5 font-mono text-base font-semibold tabular-nums transition-opacity ${tone} ${isLoading ? 'opacity-60' : ''}`}>{value}</dd>
      {note && <dd className="text-[10px] leading-snug text-slate-500">{note}</dd>}
    </div>
  )
}
