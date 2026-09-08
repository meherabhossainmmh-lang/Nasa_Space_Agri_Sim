import { useCallback, useState } from 'react'
import { DEFAULT_CONFIG, defaultParamsFromConfig } from '../services/defaultConfig.js'

/**
 * Holds the user's current simulation parameters.
 * Components only ever call `setParam(name, value)`; nothing else mutates state.
 */
export function useSimulationParams(config = DEFAULT_CONFIG) {
  const [params, setParams] = useState(() => defaultParamsFromConfig(config))

  const setParam = useCallback((name, value) => {
    setParams((previous) => (previous[name] === value ? previous : { ...previous, [name]: value }))
  }, [])

  const resetParams = useCallback(() => {
    setParams(defaultParamsFromConfig(config))
  }, [config])

  return { params, setParam, resetParams }
}
