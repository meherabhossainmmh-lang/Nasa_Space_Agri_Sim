import { useCallback, useMemo, useState } from 'react'
import { DEFAULT_CONFIG, defaultParamsFromConfig } from '../services/defaultConfig.js'
import { clampToRange, sanitiseParams } from '../services/validation.js'

/**
 * Holds the user's current simulation parameters.
 * Components only ever call `setParam(name, value)`; nothing else mutates state.
 * Values are clamped to the ranges in `config` so the API never sees bad input.
 */
export function useSimulationParams(config = DEFAULT_CONFIG) {
  const [rawParams, setRawParams] = useState(() => defaultParamsFromConfig(config))

  // If the backend config arrives with different ranges, the stored values are
  // re-clamped on the fly. Derived during render (memoised) rather than via an
  // effect, so there is never an intermediate render with out-of-range values.
  const params = useMemo(() => {
    const cleaned = sanitiseParams(rawParams, config)
    const changed = Object.keys(cleaned).some((k) => cleaned[k] !== rawParams[k])
    return changed ? cleaned : rawParams
  }, [rawParams, config])

  const setParam = useCallback(
    (name, value) => {
      const range = config.parameters?.[name]
      const next = range ? clampToRange(value, range) : value
      setRawParams((previous) => (previous[name] === next ? previous : { ...previous, [name]: next }))
    },
    [config],
  )

  const resetParams = useCallback(() => {
    setRawParams(defaultParamsFromConfig(config))
  }, [config])

  return { params, setParam, resetParams }
}
