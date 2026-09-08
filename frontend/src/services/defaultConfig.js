/**
 * Fallback control configuration.
 *
 * The dashboard normally loads ranges/defaults from GET /api/config so the
 * backend stays the single source of truth. These values mirror
 * backend/app/config/simulation_constants.py and are only used until that
 * request completes (or if the backend is unreachable) so the sliders still
 * render sensibly.
 */
export const DEFAULT_CONFIG = {
  defaultCrop: 'lettuce',
  crops: [
    { key: 'lettuce', name: 'Lettuce', emoji: '🥬', growthDurationDays: 35, harvestBiomassG: 2000 },
    { key: 'tomato', name: 'Tomato', emoji: '🍅', growthDurationDays: 80, harvestBiomassG: 3500 },
    { key: 'radish', name: 'Radish', emoji: '🌱', growthDurationDays: 28, harvestBiomassG: 1200 },
  ],
  parameters: {
    gravity: { min: 0, max: 2, step: 0.01, default: 0, unit: 'g' },
    radiation: { min: 0, max: 3, step: 0.01, default: 0.3, unit: 'mGy/day' },
    waterAvailability: { min: 0, max: 100, step: 1, default: 100, unit: '%' },
    lightHours: { min: 0, max: 24, step: 0.5, default: 16, unit: 'h/day' },
    co2Level: { min: 300, max: 3000, step: 10, default: 1000, unit: 'ppm' },
    growingArea: { min: 0.1, max: 100, step: 0.1, default: 10, unit: 'm²' },
    simulationDays: { min: 1, max: 365, step: 1, default: 30, unit: 'days' },
  },
  durationOptions: [7, 14, 30, 60, 90],
  gravityPresets: [
    { label: 'Microgravity', value: 0 },
    { label: 'Moon', value: 0.16 },
    { label: 'Mars', value: 0.38 },
    { label: 'Earth', value: 1 },
  ],
  radiationPresets: [
    { label: 'Earth surface', value: 0.01 },
    { label: 'Mars surface', value: 0.2 },
    { label: 'ISS orbit', value: 0.3 },
    { label: 'Deep space', value: 0.5 },
  ],
}

/** Build the initial parameter set from a config object. */
export function defaultParamsFromConfig(config) {
  const p = config.parameters
  return {
    crop: config.defaultCrop,
    gravity: p.gravity.default,
    radiation: p.radiation.default,
    waterAvailability: p.waterAvailability.default,
    lightHours: p.lightHours.default,
    co2Level: p.co2Level.default,
    growingArea: p.growingArea.default,
    simulationDays: p.simulationDays.default,
    earthComparisonMode: 'matched',
  }
}
