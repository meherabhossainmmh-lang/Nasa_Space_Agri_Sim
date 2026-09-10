import { useCallback, useEffect, useRef, useState } from 'react'
import { runSimulation } from '../services/simulationApi.js'

const DEBOUNCE_MS = 120

/**
 * Re-runs the simulation whenever `params` change.
 *
 * - debounced so dragging a slider doesn't fire dozens of requests
 * - in-flight requests are aborted when a newer one starts, so results
 *   can never arrive out of order
 * - the previous result stays on screen while the next one loads
 */
export function useSimulation(params) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const abortRef = useRef(null)

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    const timer = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsLoading(true)
      runSimulation(params, { signal: controller.signal })
        .then((data) => {
          if (controller.signal.aborted) return
          setResult(data)
          setError(null)
        })
        .catch((err) => {
          if (controller.signal.aborted || err.name === 'AbortError') return
          setError(err)
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [params, attempt])

  // abort anything still running when the component unmounts
  useEffect(() => () => abortRef.current?.abort(), [])

  return { result, error, isLoading, retry }
}
