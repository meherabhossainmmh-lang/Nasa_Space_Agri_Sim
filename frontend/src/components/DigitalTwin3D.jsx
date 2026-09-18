import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import Panel from './Panel.jsx'
import { deriveTwinState, deviceCanRender3D, webglAvailable } from '../services/twinState.js'
import { formatDay, formatMass, formatNumber, formatPercent } from '../services/formatters.js'

// three.js is only downloaded when the twin is switched on
const GrowthChamberScene = lazy(() => import('../three/GrowthChamberScene.jsx'))

const STORAGE_KEY = 'spaceagrisim.twin3d'

/** 'on' | 'off' when the user has toggled the view before, otherwise null. */
function readStoredPreference() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'on' || value === 'off' ? value : null
  } catch {
    return null
  }
}

/**
 * 3D is on by default when the browser has WebGL and the device looks capable;
 * an explicit user choice always wins. Weak devices and small screens start in 2D.
 */
function initialEnabled(webgl) {
  const stored = readStoredPreference()
  if (stored) return stored === 'on'
  return webgl && deviceCanRender3D()
}

const LEGEND = [
  { key: 'growth', label: 'Growth', color: '#4ade80', read: (s) => `${formatNumber(s.canopyScale * 100, 0)}% of a full canopy` },
  { key: 'water', label: 'Water', color: '#60a5fa', read: (s) => (s.waterDeficit ? `${formatNumber(s.waterSupply * 100, 0)}% supplied · deficit` : 'demand met') },
  { key: 'radiation', label: 'Radiation', color: '#f87171', read: (s) => `${formatNumber(s.radiationMgy, 2)} mGy/day${s.radiationWarning ? ' · warning' : ''}` },
  { key: 'co2', label: 'CO₂', color: '#c084fc', read: (s) => `${formatNumber(s.co2Ppm, 0)} ppm` },
  { key: 'o2', label: 'O₂', color: '#7dd3fc', read: (s) => `${formatNumber(s.gasActivity * 100, 0)}% exchange activity` },
]

/**
 * SPACE GROWTH CHAMBER digital twin.
 *
 * - on by default when WebGL is available and the device looks capable,
 *   with a clear 3D VIEW ON/OFF switch (choice is remembered)
 * - lazy-loads three.js / react-three-fiber
 * - falls back to a 2D schematic when WebGL is unavailable or the renderer fails
 * - reads only from the simulation result (via deriveTwinState)
 */
export default function DigitalTwin3D({ result }) {
  const webgl = useMemo(() => webglAvailable(), [])
  const [enabled, setEnabled] = useState(() => initialEnabled(webgl))
  const [reducedMotion, setReducedMotion] = useState(false)
  const [renderError, setRenderError] = useState(null)
  const [inView, setInView] = useState(true)
  const viewportRef = useRef(null)
  const state = useMemo(() => deriveTwinState(result), [result])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  // pause the render loop while the chamber is scrolled out of view
  useEffect(() => {
    const node = viewportRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const toggle = () => {
    setEnabled((value) => {
      const next = !value
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off')
      } catch {
        /* private mode: preference simply is not remembered */
      }
      return next
    })
  }

  const canRender3D = webgl && !renderError

  return (
    <Panel
      id="digital-twin"
      eyebrow="07"
      title="Space growth chamber"
      subtitle="3D digital twin · driven by the simulation outputs, not by its own model"
      padded={false}
      action={
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          className={`rounded border px-2.5 py-1 font-mono text-[10px] tracking-wider transition-colors ${
            enabled ? 'border-accent/60 bg-accent/10 text-accent' : 'border-line-strong text-slate-300 hover:border-accent/60 hover:text-accent'
          }`}
        >
          3D VIEW {enabled ? 'ON' : 'OFF'}
        </button>
      }
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div ref={viewportRef} className="relative min-h-[16rem] sm:min-h-[20rem] lg:min-h-[22rem]">
          {!state && <Placeholder text="Waiting for simulation…" />}
          {state && !enabled && (
            <Placeholder text="3D view is off">
              <SchematicTwin state={state} />
            </Placeholder>
          )}
          {state && enabled && !canRender3D && (
            <div className="absolute inset-0 flex flex-col">
              <p className="border-b border-line bg-space-800/60 px-3 py-1.5 font-mono text-[10px] tracking-wider text-warn">
                {renderError ? '3D RENDERER FAILED' : 'WEBGL UNAVAILABLE'} · SHOWING 2D SCHEMATIC
              </p>
              <div className="relative flex-1">
                <SchematicTwin state={state} />
              </div>
            </div>
          )}
          {state && enabled && canRender3D && (
            <div className="absolute inset-0">
              <SceneErrorBoundary onError={setRenderError}>
                <Suspense fallback={<Placeholder text="Loading 3D chamber…" />}>
                  <GrowthChamberScene state={state} reduced={reducedMotion} paused={!inView} />
                </Suspense>
              </SceneErrorBoundary>
              <div className="pointer-events-none absolute left-3 top-3 rounded border border-line bg-space-950/70 px-2 py-1 font-mono text-[10px] tracking-wider text-slate-300">
                {formatDay(state.day)} · {harvestCaption(state)}
              </div>
              <StatusTags state={state} />
            </div>
          )}
          {state && (
            <p className="pointer-events-none absolute bottom-2 right-3 font-mono text-[9px] tracking-wider text-slate-500">
              VISUALIZATION DRIVEN BY SIMULATION OUTPUTS
            </p>
          )}
        </div>

        <aside className="border-t border-line px-4 py-3 lg:border-l lg:border-t-0" aria-label="Digital twin legend">
          <p className="label-tech">Legend</p>
          <ul className="mt-2 space-y-2">
            {LEGEND.map((item) => (
              <li key={item.key} className="flex items-start gap-2 text-[11px]">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-sm" style={{ background: item.color }} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="font-mono text-[10px] tracking-wider text-slate-300">{item.label.toUpperCase()}</span>
                  <br />
                  <span className="text-slate-500">{state ? item.read(state) : '–'}</span>
                </span>
              </li>
            ))}
          </ul>
          {state && (
            <p className="mt-3 border-t border-line pt-2 text-[10px] leading-snug text-slate-500">
              Plant size follows standing biomass ({formatMass(result.harvest.standingBiomass)}); leaf colour follows the space-vs-Earth ratio (
              {formatPercent(result.comparison.spaceGrowthPercentage, { digits: 0 })}). Panels, water lines and indicators mirror the control settings.
            </p>
          )}
        </aside>
      </div>
    </Panel>
  )
}

/** Overlay caption: what the chamber is showing in harvest terms. */
function harvestCaption(state) {
  if (!state.harvestWithinWindow) return `NEXT HARVEST ${formatDay(state.nextHarvestDay).toUpperCase()}`
  const cycles = state.cyclesCompleted
  return `${cycles} HARVEST${cycles === 1 ? '' : 'S'} · LAST ${formatDay(state.lastHarvestDay).toUpperCase()} · REGROWING`
}

/** Small amber tags that make the stress cues in the scene explicit. */
function StatusTags({ state }) {
  const tags = []
  if (state.noArea) tags.push('NO GROWING AREA')
  else if (state.noGrowth) tags.push('NO GROWTH')
  if (state.waterDeficit) tags.push('WATER DEFICIT')
  if (state.radiationWarning) tags.push('HIGH RADIATION')
  if (tags.length === 0) return null
  return (
    <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-1">
      {tags.map((tag) => (
        <span key={tag} className="rounded border border-warn/50 bg-space-950/70 px-2 py-0.5 font-mono text-[10px] tracking-wider text-warn">
          {tag}
        </span>
      ))}
    </div>
  )
}

function Placeholder({ text, children }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {children ? <div className="relative flex-1">{children}</div> : null}
      <p className={`${children ? 'border-t border-line bg-space-800/60' : 'm-auto'} px-3 py-1.5 font-mono text-[10px] tracking-wider text-slate-500`}>
        {text}
      </p>
    </div>
  )
}

/** 2D SVG schematic of the chamber, used before the 3D view is enabled and as the WebGL fallback. */
function SchematicTwin({ state }) {
  const plants = []
  const rows = state.rows
  const perRow = state.perRow
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < perRow; c += 1) {
      plants.push({ x: 60 + ((c + 0.5) * 280) / perRow, y: 150 - r * 22, r: 4 + state.canopyScale * 9 })
    }
  }
  const leaf = state.health > 0.8 ? '#4ade80' : state.health > 0.5 ? '#86c75a' : '#a3a34a'
  const water = state.waterDeficit ? '#fbbf24' : '#60a5fa'
  return (
    <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full" role="img" aria-label="Schematic of the growth chamber">
      <rect x="40" y="20" width="320" height="160" fill="#0c1426" stroke="#27365a" />
      {/* light panels */}
      {[80, 170, 260].map((x) => (
        <rect key={x} x={x} y="26" width="60" height="5" fill="#fbbf24" opacity={0.2 + state.light * 0.8} />
      ))}
      {/* trays */}
      {Array.from({ length: rows }).map((_, r) => (
        <rect key={r} x="60" y={152 - r * 22} width="280" height="4" fill="#1b2a44" />
      ))}
      {/* plants */}
      {plants.map((p, i) => (
        <g key={i}>
          <line x1={p.x} y1={p.y + 2} x2={p.x} y2={p.y - p.r} stroke="#5b8a5b" strokeWidth="1.5" />
          <ellipse cx={p.x} cy={p.y - p.r} rx={p.r} ry={p.r * 0.6} fill={leaf} />
        </g>
      ))}
      {/* water line */}
      <line x1="60" y1="168" x2="340" y2="168" stroke={water} strokeWidth="2" opacity={0.3 + state.waterSupply * 0.7} />
      {/* indicators */}
      <rect x="46" y="60" width="6" height={10 + state.radiation * 30} fill="#f87171" />
      <rect x="338" y="60" width="6" height={10 + state.co2Level * 30} fill="#c084fc" />
      <rect x="348" y="60" width="6" height={10 + state.gasActivity * 30} fill="#7dd3fc" />
      {state.noArea && (
        <text x="200" y="105" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
          NO GROWING AREA
        </text>
      )}
    </svg>
  )
}


class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
