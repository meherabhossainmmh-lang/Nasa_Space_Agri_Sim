/**
 * Maps a simulation result onto the visual state of the 3D growth chamber.
 *
 * Everything here is presentation: it rescales numbers the API already
 * returned into 0..1 intensities the scene can render. No simulation maths.
 */
export function deriveTwinState(result) {
  if (!result) return null

  const last = result.dailyGrowthData[result.dailyGrowthData.length - 1]
  const harvest = result.harvest
  const water = result.lifeSupport.water
  const factors = result.space.factors
  const inputs = result.inputs
  const co2 = inputs.co2Level

  // plant size follows the standing biomass fraction of a full cycle
  const growthFraction = Math.max(0, Math.min(1, last?.growthFraction ?? 0))
  const canopyScale = harvest.potentialHarvest > 0 ? Math.min(harvest.standingBiomass / harvest.potentialHarvest, 1) : 0

  // how healthy the crop looks relative to the Earth reference (0..1)
  const health = result.comparison.isDefined === false ? (result.cropYield > 0 ? 1 : 0) : Math.max(0, Math.min(1, result.comparison.spaceGrowthPercentage / 100))

  // supplied share of demand, 0..1 - drives the water line brightness
  const waterSupply = water.demand > 0 ? Math.max(0, Math.min(1, water.supplied / water.demand)) : inputs.waterAvailability / 100

  // radiation on a 0..1 scale (slider max is 3 mGy/day); light on 0..1 (24 h max)
  const radiation = Math.max(0, Math.min(1, inputs.radiation / 3))
  const light = Math.max(0, Math.min(1, inputs.lightHours / 24))

  // 0..1 CO2 enrichment (300..3000 ppm slider range)
  const co2Level = Math.max(0, Math.min(1, (co2 - 300) / 2700))

  // O2 output intensity: relative to a full healthy cycle so the indicator scales with the chamber
  const gasActivity = Math.max(0, Math.min(1, factors.combined))

  // number of plant rows / plants per row scales gently with area
  const area = inputs.growingArea
  const rows = area <= 0 ? 0 : Math.max(1, Math.min(4, Math.round(Math.sqrt(area / 2))))
  const perRow = area <= 0 ? 0 : Math.max(2, Math.min(7, Math.round(Math.sqrt(area) + 1)))

  return {
    crop: result.crop.key,
    growthFraction,
    canopyScale,
    health,
    waterSupply,
    waterDeficit: water.deficit > 0,
    radiation,
    light,
    co2Level,
    gasActivity,
    rows,
    perRow,
    noArea: area <= 0,
    harvestWithinWindow: harvest.harvestWithinWindow,
    day: inputs.simulationDays,
    nextHarvestDay: harvest.nextHarvestDay,
  }
}

/** Detects whether the browser can create a WebGL context. */
export function webglAvailable() {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}
