import { formatDay, formatMass, formatPercent, formatVolume, relativeChangePercent } from './formatters.js'

/**
 * Turns API outputs into short sentences for the MISSION INSIGHT panel.
 *
 * Nothing here is computed from the model - every figure is read from the
 * response (or is a relative change between two responses for the
 * "what changed" comparison). No hard-coded numbers.
 */

const FACTOR_NAMES = { gravity: 'reduced gravity', radiation: 'radiation', water: 'water shortage', light: 'photoperiod', co2: 'CO₂ enrichment' }

/** One-sentence summary of the current result. */
export function missionInsight(result) {
  if (!result) return null
  const c = result.comparison
  const harvest = result.harvest
  const crop = result.crop.name.toLowerCase()
  const days = result.inputs.simulationDays

  if (result.cropYield <= 0) {
    return `No biomass is produced in this scenario: at least one driver (water, light or growing area) is zero, so nothing grows within ${days} days.`
  }
  if (c.isDefined === false) {
    return `The space scenario produced ${formatMass(result.cropYield)} of ${crop} but the Earth reference produced nothing, so no comparison is possible.`
  }

  const impact = c.impact
  const limiting = impact?.limitingFactor ? FACTOR_NAMES[impact.limitingFactor] : null
  const limitingStep = impact?.factors.find((f) => f.key === impact.limitingFactor)
  const boosting = impact?.boostingFactor ? FACTOR_NAMES[impact.boostingFactor] : null
  const boostingStep = impact?.factors.find((f) => f.key === impact.boostingFactor)

  const parts = []
  if (Math.abs(c.differencePercent) < 0.05) {
    parts.push(`Under these settings the space scenario matches the Earth reference (${formatMass(c.spaceYield)} of ${crop} over ${days} days).`)
  } else if (c.differencePercent < 0) {
    parts.push(
      `Under these settings ${crop} biomass is ${formatPercent(Math.abs(c.differencePercent), { digits: 1 })} lower than the Earth reference after ${days} days`,
    )
    if (limiting && limitingStep) parts.push(`, mainly because of ${limiting} (${formatPercent(limitingStep.percent, { signed: true, digits: 0 })})`)
    if (boosting && boostingStep) parts.push(`; ${boosting} (${formatPercent(boostingStep.percent, { signed: true, digits: 0 })}) partly offsets it`)
    parts.push('.')
  } else {
    parts.push(`Under these settings ${crop} biomass is ${formatPercent(c.differencePercent, { digits: 1 })} higher than the Earth reference after ${days} days`)
    if (boosting && boostingStep) parts.push(`, driven by ${boosting} (${formatPercent(boostingStep.percent, { signed: true, digits: 0 })})`)
    parts.push('.')
  }

  if (!harvest.harvestWithinWindow) {
    parts.push(` No harvest occurs within the window: the ${harvest.cycleLengthDays}-day cycle completes on ${formatDay(harvest.nextHarvestDay)}.`)
  } else {
    parts.push(` ${harvest.cyclesCompleted} ${harvest.cyclesCompleted === 1 ? 'harvest' : 'harvests'} (${formatMass(harvest.harvestedYield)}) fall inside the window; ${formatMass(harvest.standingBiomass)} is still growing at the end.`)
  }

  const water = result.lifeSupport.water
  if (water.deficit > 0) {
    parts.push(` The water loop is short by ${formatVolume(water.deficit)} (${formatPercent(water.deficitPercent, { digits: 0 })} of demand), which already limits growth.`)
  }
  return parts.join('')
}

/** Metrics compared in the what-if panel, with how a change should be read. */
export const WHAT_IF_METRICS = [
  { key: 'cropYield', label: 'Total biomass', read: (r) => r.cropYield, format: formatMass, goodWhen: 'up' },
  { key: 'o2', label: 'O₂ production', read: (r) => r.estimatedOxygenProduced, format: formatMass, goodWhen: 'up' },
  { key: 'co2', label: 'CO₂ removal', read: (r) => r.co2Removed, format: formatMass, goodWhen: 'up' },
  { key: 'waterDeficit', label: 'Water deficit', read: (r) => r.lifeSupport.water.deficit, format: formatVolume, goodWhen: 'down' },
  { key: 'waterSupplied', label: 'Water supplied', read: (r) => r.lifeSupport.water.supplied, format: formatVolume, goodWhen: 'neutral' },
]

/** Baseline-vs-current deltas for the what-if panel. */
export function whatIfDeltas(baseline, current) {
  if (!baseline || !current) return []
  return WHAT_IF_METRICS.map((m) => {
    const before = m.read(baseline)
    const after = m.read(current)
    const change = relativeChangePercent(before, after)
    const direction = after > before + 1e-9 ? 'up' : after < before - 1e-9 ? 'down' : 'same'
    const tone =
      direction === 'same' || m.goodWhen === 'neutral' ? 'neutral' : direction === m.goodWhen ? 'good' : 'bad'
    return { ...m, before, after, change, direction, tone }
  })
}

const PARAM_LABELS = {
  crop: 'Crop',
  gravity: 'Gravity',
  radiation: 'Radiation',
  waterAvailability: 'Water availability',
  lightHours: 'Photoperiod',
  co2Level: 'CO₂',
  growingArea: 'Growing area',
  simulationDays: 'Duration',
  earthComparisonMode: 'Comparison mode',
}

/** Which inputs differ between two parameter sets, as readable labels. */
export function changedParameters(baselineParams, currentParams, config) {
  if (!baselineParams || !currentParams) return []
  const units = config?.parameters ?? {}
  return Object.keys(PARAM_LABELS)
    .filter((k) => baselineParams[k] !== currentParams[k])
    .map((k) => {
      const unit = units[k]?.unit ?? ''
      const show = (v) => (typeof v === 'number' ? `${v} ${unit}`.trim() : String(v))
      return { key: k, label: PARAM_LABELS[k], from: show(baselineParams[k]), to: show(currentParams[k]) }
    })
}
