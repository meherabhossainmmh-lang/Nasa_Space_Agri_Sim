/**
 * Keyboard helpers for the custom radio groups (crop cards, duration
 * segments, chart mode toggles).
 *
 * The WAI-ARIA radio pattern: one tab stop per group (the selected item),
 * arrow keys move the selection, Home/End jump to the ends.
 */
const NEXT_KEYS = ['ArrowRight', 'ArrowDown']
const PREV_KEYS = ['ArrowLeft', 'ArrowUp']

export function handleRadioGroupKeyDown(event, values, current, onChange) {
  const isNext = NEXT_KEYS.includes(event.key)
  const isPrev = PREV_KEYS.includes(event.key)
  if (!isNext && !isPrev && event.key !== 'Home' && event.key !== 'End') return
  if (values.length === 0) return
  event.preventDefault()

  const index = values.indexOf(current)
  let nextIndex
  if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = values.length - 1
  else nextIndex = (index + (isNext ? 1 : -1) + values.length) % values.length

  onChange(values[nextIndex])
  const radios = event.currentTarget.querySelectorAll('[role="radio"]')
  radios[nextIndex]?.focus()
}

/** Roving tabindex: only the selected radio is reachable with Tab. */
export function radioTabIndex(selected) {
  return selected ? 0 : -1
}
