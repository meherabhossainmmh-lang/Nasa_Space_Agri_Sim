/**
 * Maps a simulation result onto the visual state of the 3D growth chamber.
 *
 * Everything here is presentation: it rescales numbers the API already
 * returned into 0..1 intensities the scene can render. No simulation maths,
 * no biology - the plants simply look bigger, paler or sparser in proportion
 * to what the model computed.
 */

// slider ranges the intensities are normalised against (mirrors the backend config)
const RADIATION_MAX_MGY = 3
const LIGHT_MAX_HOURS = 24
const CO2_MIN_PPM = 300
const CO2_MAX_PPM = 3000

const clamp01 = (v) => Math.max(0, Math.min(1, v))

export function deriveTwinState(result) {
  if (!result) return null

  const days = result.dailyGrowthData
  const last = days[days.length - 1]
  const harvest = result.harvest
  const water = result.lifeSupport.water
  const factors = result.space.factors
  const inputs = result.inputs

  // plant size follows the standing biomass as a share of one full cycle
  const canopyScale = harvest.potentialHarvest > 0 ? clamp01(harvest.standingBiomass / harvest.potentialHarvest) : 0

  // how healthy the crop looks relative to the Earth reference (0..1)
  const health =
    result.comparison.isDefined === false ? (result.cropYield > 0 ? 1 : 0) : clamp01(result.comparison.spaceGrowthPercentage / 100)

  // supplied share of demand, 0..1 - drives the water manifold
  const waterSupply = water.demand > 0 ? clamp01(water.supplied / water.demand) : clamp01(inputs.waterAvailability / 100)

  const radiation = clamp01(inputs.radiation / RADIATION_MAX_MGY)
  const light = clamp01(inputs.lightHours / LIGHT_MAX_HOURS)
  const co2Level = clamp01((inputs.co2Level - CO2_MIN_PPM) / (CO2_MAX_PPM - CO2_MIN_PPM))

  // gas exchange activity relative to reference growth, scaled by how much canopy is present
  const gasActivity = clamp01(factors.combined) * canopyScale

  // plant count scales gently with the growing area (visual density only)
  const area = inputs.growingArea
  const rows = area <= 0 ? 0 : Math.max(1, Math.min(4, Math.round(Math.sqrt(area / 1.2))))
  const perRow = area <= 0 ? 0 : Math.max(4, Math.min(9, Math.round(Math.sqrt(area) * 1.4 + 3)))

  return {
    crop: result.crop.key,
    growthFraction: clamp01(last?.growthFraction ?? 0),
    canopyScale,
    health,
    waterSupply,
    waterDeficit: water.deficit > 0,
    radiation,
    radiationMgy: inputs.radiation,
    radiationWarning: inputs.radiation >= 1.0,
    light,
    lightHours: inputs.lightHours,
    co2Level,
    co2Ppm: inputs.co2Level,
    gasActivity,
    rows,
    perRow,
    noArea: area <= 0,
    noGrowth: result.cropYield <= 0,
    harvestWithinWindow: harvest.harvestWithinWindow,
    cyclesCompleted: harvest.cyclesCompleted,
    lastHarvestDay: harvest.lastHarvestDay,
    day: inputs.simulationDays,
    nextHarvestDay: harvest.nextHarvestDay,
    standingBiomass: harvest.standingBiomass,
    spaceGrowthPercentage: result.comparison.spaceGrowthPercentage,
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

/**
 * Rough capability check: small screens, save-data mode and very low core
 * counts default to the 2D view (the user can still switch 3D on).
 */
export function deviceCanRender3D() {
  if (typeof window === 'undefined') return false
  const narrow = window.matchMedia('(max-width: 640px)').matches
  const saveData = navigator.connection?.saveData === true
  const cores = navigator.hardwareConcurrency ?? 4
  const memory = navigator.deviceMemory ?? 4
  return !narrow && !saveData && cores >= 2 && memory >= 2
}
