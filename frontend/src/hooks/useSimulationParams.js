import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_CONFIG, defaultParamsFromConfig } from '../services/defaultConfig.js'
import { clampToRange, sanitiseParams } from '../services/validation.js'

/**
 * Holds the user's current simulation parameters.
 * Components only ever call `setParam(name, value)`; nothing else mutates state.
 * Values are clamped to the ranges in `config` so the API never sees bad input.
 */
export function useSimulationParams(config = DEFAULT_CONFIG) {
  const [params, setParams] = useState(() => defaultParamsFromConfig(config))

  // if the backend config arrives with different ranges, keep params inside them
  useEffect(() => {
    setParams((previous) => {
      const cleaned = sanitiseParams(previous, config)
      const changed = Object.keys(cleaned).some((k) => cleaned[k] !== previous[k])
      return changed ? cleaned : previous
    })
  }, [config])

  const setParam = useCallback(
    (name, value) => {
      const range = config.parameters?.[name]
      const next = range ? clampToRange(value, range) : value
      setParams((previous) => (previous[name] === next ? previous : { ...previous, [name]: next }))
    },
    [config],
  )

  const resetParams = useCallback(() => {
    setParams(defaultParamsFromConfig(config))
  }, [config])

  return { params, setParam, resetParams }
}
