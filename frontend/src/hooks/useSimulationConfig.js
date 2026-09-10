import { useEffect, useState } from 'react'
import { fetchSimulationConfig } from '../services/simulationApi.js'
import { DEFAULT_CONFIG } from '../services/defaultConfig.js'

/**
 * Loads slider ranges / defaults / presets from the backend once.
 * Falls back to the bundled defaults so the UI never renders empty.
 */
export function useSimulationConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [source, setSource] = useState('fallback')

  useEffect(() => {
    const controller = new AbortController()
    fetchSimulationConfig({ signal: controller.signal })
      .then((data) => {
        setConfig(data)
        setSource('backend')
      })
      .catch(() => {
        /* keep the fallback config */
      })
    return () => controller.abort()
  }, [])

  return { config, source }
}
