/**
 * Number formatting helpers shared by cards, charts and controls.
 * Keeping them here avoids each component re-implementing unit logic.
 * These only format values the API already computed - no simulation maths.
 */

const formatters = new Map()

function withDigits(digits) {
  if (!formatters.has(digits)) {
    formatters.set(digits, new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }))
  }
  return formatters.get(digits)
}

export function formatNumber(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '–'
  return withDigits(digits).format(Number(Number(value).toFixed(digits)))
}

/** Grams -> "850 g", "1.24 kg" or "18.3 kg" depending on size. */
export function formatMass(grams) {
  if (grams == null || Number.isNaN(grams)) return '–'
  const abs = Math.abs(grams)
  if (abs >= 10000) return `${formatNumber(grams / 1000, 1)} kg`
  if (abs >= 1000) return `${formatNumber(grams / 1000, 2)} kg`
  return `${formatNumber(grams, 0)} g`
}

/** Litres -> "12.5 L" or "1.2 m³". */
export function formatVolume(litres) {
  if (litres == null || Number.isNaN(litres)) return '–'
  if (Math.abs(litres) >= 1000) return `${formatNumber(litres / 1000, 2)} m³`
  return `${formatNumber(litres, 1)} L`
}

export function formatPercent(value, { signed = false, digits = 1 } = {}) {
  if (value == null || Number.isNaN(value)) return '–'
  const sign = signed && value > 0 ? '+' : ''
  return `${sign}${formatNumber(value, digits)}%`
}

/** Signed percentage points, e.g. "-15.0 pts". */
export function formatPoints(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '–'
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatNumber(value, digits)} pts`
}

export function formatDays(value, digits = 0) {
  if (value == null || Number.isNaN(value)) return '–'
  const n = formatNumber(value, digits)
  return `${n} ${Number(n) === 1 ? 'day' : 'days'}`
}

/** "Day 35" */
export function formatDay(day) {
  if (day == null) return '–'
  return `Day ${formatNumber(day, 0)}`
}

/** Growth factor -> "×0.85" */
export function formatFactor(value) {
  if (value == null || Number.isNaN(value)) return '–'
  return `×${Number(value).toFixed(2)}`
}

/** Value with its unit, respecting the slider step for decimals. */
export function formatWithUnit(value, unit, step = 1) {
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : 2
  return `${formatNumber(value, decimals)} ${unit}`.trim()
}

/** Relative change between two API values, as a signed percent (presentation only). */
export function relativeChangePercent(before, after) {
  if (before == null || after == null) return null
  if (Math.abs(before) < 1e-9) return Math.abs(after) < 1e-9 ? 0 : null
  return ((after - before) / Math.abs(before)) * 100
}
