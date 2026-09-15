import { Component, Suspense, lazy, useEffect, useMemo, useState } from 'react'
import Panel from './Panel.jsx'
import { deriveTwinState, webglAvailable } from '../services/twinState.js'
import { formatDay, formatMass, formatNumber, formatPercent } from '../services/formatters.js'

// three.js is only downloaded when the twin is switched on
const GrowthChamberScene = lazy(() => import('../three/GrowthChamberScene.jsx'))

const LEGEND = [
  { key: 'growth', label: 'Growth', color: '#4ade80', read: (s) => `${formatNumber(s.canopyScale * 100, 0)}% of a full canopy` },
  { key: 'water', label: 'Water', color: '#60a5fa', read: (s) => (s.waterDeficit ? `${formatNumber(s.waterSupply * 100, 0)}% supplied · deficit` : 'demand met') },
  { key: 'radiation', label: 'Radiation', color: '#f87171', read: (s) => `${formatNumber(s.radiation * 3, 2)} mGy/day` },
  { key: 'co2', label: 'CO₂', color: '#c084fc', read: (s) => `${formatNumber(300 + s.co2Level * 2700, 0)} ppm` },
  { key: 'o2', label: 'O₂', color: '#7dd3fc', read: (s) => `${formatNumber(s.gasActivity * 100, 0)}% exchange activity` },
]

/**
 * SPACE GROWTH CHAMBER digital twin.
 *
 * - off by default, switched on with a toggle (keeps first paint light)
 * - lazy-loads three.js / react-three-fiber
 * - falls back to a 2D schematic when WebGL is unavailable
 * - reads only from the simulation result (via deriveTwinState)
 */
export default function DigitalTwin3D({ result }) {
  const [enabled, setEnabled] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [renderError, setRenderError] = useState(null)
  const state = useMemo(() => deriveTwinState(result), [result])
  const webgl = useMemo(() => webglAvailable(), [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

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
          onClick={() => setEnabled((v) => !v)}
          className={`rounded border px-2.5 py-1 font-mono text-[10px] tracking-wider transition-colors ${
            enabled ? 'border-accent/60 bg-accent/10 text-accent' : 'border-line-strong text-slate-300 hover:border-accent/60 hover:text-accent'
          }`}
        >
          3D VIEW {enabled ? 'ON' : 'OFF'}
        </button>
      }
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="relative min-h-[16rem] sm:min-h-[20rem] lg:min-h-[22rem]">
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
                  <GrowthChamberScene state={state} reduced={reducedMotion} />
                </Suspense>
              </SceneErrorBoundary>
              <div className="pointer-events-none absolute left-3 top-3 rounded border border-line bg-space-950/70 px-2 py-1 font-mono text-[10px] tracking-wider text-slate-300">
                {formatDay(state.day)} · {state.harvestWithinWindow ? 'HARVEST CYCLE COMPLETE' : `NEXT HARVEST ${formatDay(state.nextHarvestDay).toUpperCase()}`}
              </div>
            </div>
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
      <rect x="348" y="60" width="6" height={10 + state.gasActivity * state.canopyScale * 30} fill="#7dd3fc" />
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
