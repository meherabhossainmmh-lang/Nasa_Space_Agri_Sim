/**
 * Number formatting helpers shared by cards, charts and controls.
 * Keeping them here avoids each component re-implementing unit logic.
 */

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const wholeFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatNumber(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return '–'
  return digits === 0 ? wholeFormat.format(value) : numberFormat.format(Number(value.toFixed(digits)))
}

/** Grams -> "850 g" or "1.24 kg" depending on size. */
export function formatMass(grams) {
  if (grams == null || Number.isNaN(grams)) return '–'
  if (Math.abs(grams) >= 1000) return `${formatNumber(grams / 1000, 2)} kg`
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

export function formatDays(value) {
  if (value == null) return '–'
  return `${formatNumber(value, 1)} d`
}
