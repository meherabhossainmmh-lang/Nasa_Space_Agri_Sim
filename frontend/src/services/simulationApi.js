/**
 * Thin client for the SpaceAgriSim backend.
 *
 * All requests go to relative `/api/...` URLs. In development the Vite dev
 * server proxies them to FastAPI (see vite.config.js); in production the
 * frontend is expected to be served behind the same origin as the API.
 */

const API_BASE = '/api'

export class ApiError extends Error {
  constructor(message, { status, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/** Turn a FastAPI validation error into something readable. */
function describeErrorBody(body) {
  if (!body) return null
  if (typeof body.message === 'string' && body.message) return body.message
  if (typeof body.detail === 'string') return body.detail
  if (Array.isArray(body.detail)) {
    return body.detail
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc.filter((p) => p !== 'body').join('.') : ''
        return field ? `${field}: ${item.msg}` : item.msg
      })
      .join('; ')
  }
  return null
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Could not reach the simulation backend. Is the API server running?', {
      details: error.message,
    })
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    /* non-JSON body, handled below */
  }

  if (!response.ok) {
    // A 5xx with no JSON body almost always means the dev proxy could not
    // reach FastAPI, so say that instead of a bare status code.
    const unreachable = response.status >= 500 && payload == null
    const message = unreachable
      ? 'Could not reach the simulation backend. Is the API server running on port 8000?'
      : describeErrorBody(payload) || `Request failed with status ${response.status}`
    throw new ApiError(message, { status: response.status, details: payload })
  }
  return payload
}

/** POST /api/simulate */
export function runSimulation(params, { signal } = {}) {
  return request('/simulate', { method: 'POST', body: params, signal })
}

/** GET /api/config - ranges, defaults, crops and presets for the controls */
export function fetchSimulationConfig({ signal } = {}) {
  return request('/config', { signal })
}

/** GET /api/crops */
export function fetchCrops({ signal } = {}) {
  return request('/crops', { signal })
}

/** GET /api/health */
export function fetchHealth({ signal } = {}) {
  return request('/health', { signal })
}
