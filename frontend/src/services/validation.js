/**
 * Client-side guard rails that mirror the backend ranges.
 *
 * The API is the real source of truth (it rejects anything out of range),
 * this only keeps slider/keyboard input inside the allowed window so we
 * never send a request we already know will fail.
 */

export function clampToRange(value, range) {
  if (!range) return value
  if (Number.isNaN(Number(value))) return range.default
  const n = Number(value)
  const clamped = Math.min(Math.max(n, range.min), range.max)
  // snap to the slider step to avoid 0.30000000000000004-style values
  const steps = Math.round((clamped - range.min) / range.step)
  const snapped = range.min + steps * range.step
  const decimals = (String(range.step).split('.')[1] || '').length
  return Number(Math.min(Math.max(snapped, range.min), range.max).toFixed(decimals))
}

/** Sanitise a whole parameter object against the config. */
export function sanitiseParams(params, config) {
  const ranges = config.parameters
  const cropKeys = config.crops.map((c) => c.key)
  const out = { ...params }
  for (const key of Object.keys(ranges)) {
    if (key in out) out[key] = clampToRange(out[key], ranges[key])
  }
  if (!cropKeys.includes(out.crop)) out.crop = config.defaultCrop
  if (!['matched', 'baseline'].includes(out.earthComparisonMode)) out.earthComparisonMode = 'matched'
  return out
}
