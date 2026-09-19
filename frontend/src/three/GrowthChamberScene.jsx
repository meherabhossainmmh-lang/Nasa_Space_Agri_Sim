import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * SPACE GROWTH CHAMBER - a lightweight procedural 3D scene.
 *
 * Visualisation layer only: every visual parameter comes from `state`
 * (see services/twinState.js), which is derived from the simulation
 * response. Nothing in here computes growth, water or gas exchange.
 *
 *   plant size / density     standing biomass share of a full cycle, area
 *   leaf colour              space-vs-Earth ratio (paler = further below Earth)
 *   leaf droop               water deficit (illustrative stress cue)
 *   LED bars                 photoperiod
 *   water manifold           supplied share of demand (amber when in deficit)
 *   radiation strip          dose rate (amber warning at high dose)
 *   CO2 / O2 strips          CO2 setting and gas-exchange activity
 *
 * Geometry is simple (boxes, cylinders, low-poly spheres) and plants are
 * instanced, so the scene stays cheap on laptops.
 */

const CHAMBER = { w: 6.4, h: 2.9, d: 4.2 }
const FRAME = '#33415c'
const PANEL = '#0b1222'
const TRAY = '#1d2c48'
const TRAY_Y = -0.85

const tmpObject = new THREE.Object3D()
const tmpColor = new THREE.Color()

function leafColor(base, health, deficit) {
  // healthy green -> pale yellow-green as the space/Earth ratio drops;
  // water deficit desaturates a little more (illustrative only)
  const c = new THREE.Color(base)
  const stressed = new THREE.Color('#9a9c4c')
  c.lerp(stressed, (1 - health) * 0.9 + (deficit ? 0.15 : 0))
  return c
}

/* ------------------------------------------------------------------ */
/* structure                                                           */
/* ------------------------------------------------------------------ */

function Frame() {
  const { w, h, d } = CHAMBER
  const t = 0.06
  const bars = useMemo(() => {
    const list = []
    const x = w / 2
    const y = h / 2
    const z = d / 2
    // 12 edges of the box
    for (const sy of [-1, 1]) for (const sz of [-1, 1]) list.push({ pos: [0, sy * y, sz * z], size: [w, t, t] })
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) list.push({ pos: [sx * x, 0, sz * z], size: [t, h, t] })
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) list.push({ pos: [sx * x, sy * y, 0], size: [t, t, d] })
    // mid rails on the long sides
    for (const sz of [-1, 1]) list.push({ pos: [0, 0.25, sz * z], size: [w, t * 0.7, t * 0.7] })
    return list
  }, [w, h, d])
  return (
    <group>
      {bars.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <boxGeometry args={b.size} />
          <meshStandardMaterial color={FRAME} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

function Enclosure() {
  const { w, h, d } = CHAMBER
  return (
    <group>
      {/* floor deck */}
      <mesh position={[0, -h / 2 + 0.04, 0]}>
        <boxGeometry args={[w - 0.1, 0.08, d - 0.1]} />
        <meshStandardMaterial color={PANEL} metalness={0.3} roughness={0.8} />
      </mesh>
      {/* back panel with subtle grid */}
      <mesh position={[0, 0, -d / 2 + 0.05]}>
        <boxGeometry args={[w - 0.1, h - 0.1, 0.04]} />
        <meshStandardMaterial color="#0d1730" roughness={0.9} />
      </mesh>
      <gridHelper args={[w - 0.2, 12, '#1c2a47', '#16223b']} position={[0, 0, -d / 2 + 0.08]} rotation={[Math.PI / 2, 0, 0]} />
      {/* transparent side and front glazing */}
      {[-1, 1].map((s) => (
        <mesh key={`side${s}`} position={[(s * (w - 0.12)) / 2, 0, 0]}>
          <boxGeometry args={[0.02, h - 0.14, d - 0.14]} />
          <meshPhysicalMaterial color="#9fd4e6" transparent opacity={0.09} roughness={0.08} metalness={0} transmission={0} />
        </mesh>
      ))}
      <mesh position={[0, 0, d / 2 - 0.06]}>
        <boxGeometry args={[w - 0.14, h - 0.14, 0.02]} />
        <meshPhysicalMaterial color="#9fd4e6" transparent opacity={0.05} roughness={0.1} />
      </mesh>
      {/* ceiling service panel */}
      <mesh position={[0, h / 2 - 0.05, 0]}>
        <boxGeometry args={[w - 0.1, 0.06, d - 0.1]} />
        <meshStandardMaterial color="#0e1729" metalness={0.4} roughness={0.7} />
      </mesh>
    </group>
  )
}

function Trays({ rows }) {
  const { w, d } = CHAMBER
  const rowGap = d / (rows + 1)
  return (
    <group>
      {Array.from({ length: rows }).map((_, r) => {
        const z = -d / 2 + rowGap * (r + 1)
        return (
          <group key={r} position={[0, TRAY_Y, z]}>
            <mesh>
              <boxGeometry args={[w - 1.0, 0.14, 0.7]} />
              <meshStandardMaterial color={TRAY} metalness={0.5} roughness={0.5} />
            </mesh>
            {/* growth medium */}
            <mesh position={[0, 0.075, 0]}>
              <boxGeometry args={[w - 1.1, 0.02, 0.6]} />
              <meshStandardMaterial color="#1f2a3d" roughness={1} />
            </mesh>
            {/* tray legs */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[(s * (w - 1.3)) / 2, -0.3, 0]}>
                <boxGeometry args={[0.05, 0.6, 0.05]} />
                <meshStandardMaterial color={FRAME} metalness={0.7} roughness={0.4} />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* plants (instanced leaves)                                            */
/* ------------------------------------------------------------------ */

/**
 * Simplified plant archetypes. Leaves are one shared curved-leaf geometry
 * drawn as instances, so a full chamber is a handful of draw calls.
 *   rosette  - lettuce / radish: whorls of leaves around a very short stem
 *   vine     - tomato: a taller stem with tiers of leaflets and fruit
 * Leaf count, length and tilt are presentation choices scaled by the
 * simulation's canopy fraction; they are not a growth model.
 */
const PLANT_ARCHETYPES = {
  lettuce: { kind: 'rosette', leaf: '#4cbf6e', length: 0.56, width: 0.55, whorls: [{ n: 7, tilt: 1.2, size: 1.0 }, { n: 5, tilt: 0.8, size: 0.78 }, { n: 4, tilt: 0.4, size: 0.55 }] },
  radish: { kind: 'rosette', leaf: '#3fae62', length: 0.5, width: 0.32, whorls: [{ n: 6, tilt: 0.95, size: 1.0 }, { n: 4, tilt: 0.55, size: 0.7 }], bulb: '#c94a63' },
  tomato: { kind: 'vine', leaf: '#3a9d5c', length: 0.34, width: 0.36, stem: 1.0, tiers: 4, leafletsPerTier: 5, fruit: '#d9534f' },
}

/** Pointed leaf outline, cupped across its width and bent down toward the tip. Base at the origin, tip along +Y. */
function makeLeafGeometry(width) {
  const shape = new THREE.Shape()
  shape.moveTo(0, 0)
  shape.quadraticCurveTo(width, 0.38, 0, 1)
  shape.quadraticCurveTo(-width, 0.38, 0, 0)
  const geometry = new THREE.ShapeGeometry(shape, 5)
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    pos.setZ(i, -(x * x) * 0.9 - y * y * 0.22)
  }
  geometry.computeVertexNormals()
  return geometry
}

/** Leaf slots for one plant: local offset, yaw, tilt from vertical and relative size, oldest (outer) leaves first. */
function leafLayout(archetype) {
  const slots = []
  if (archetype.kind === 'rosette') {
    archetype.whorls.forEach((whorl, w) => {
      for (let i = 0; i < whorl.n; i += 1) {
        const yaw = (i / whorl.n) * Math.PI * 2 + w * 0.5
        slots.push({ yaw, tilt: whorl.tilt, size: whorl.size, height: 0.03 + w * 0.02, radial: 0.02 })
      }
    })
  } else {
    for (let t = 0; t < archetype.tiers; t += 1) {
      const height = archetype.stem * (0.3 + (0.7 * t) / (archetype.tiers - 1))
      for (let i = 0; i < archetype.leafletsPerTier; i += 1) {
        const yaw = (i / archetype.leafletsPerTier) * Math.PI * 2 + t * 0.8
        slots.push({ yaw, tilt: 1.25, size: 1 - t * 0.12, height, radial: 0.02 })
      }
    }
  }
  return slots
}

function Plants({ state, reduced }) {
  const archetype = PLANT_ARCHETYPES[state.crop] ?? PLANT_ARCHETYPES.lettuce
  const leavesRef = useRef()
  const stemsRef = useRef()
  const extrasRef = useRef()
  const { w, d } = CHAMBER

  const leafGeometry = useMemo(() => makeLeafGeometry(archetype.width), [archetype.width])
  const stemGeometry = useMemo(() => new THREE.CylinderGeometry(0.014, 0.026, 1, 6).translate(0, 0.5, 0), [])
  const slots = useMemo(() => leafLayout(archetype), [archetype])
  useEffect(() => () => leafGeometry.dispose(), [leafGeometry])
  useEffect(() => () => stemGeometry.dispose(), [stemGeometry])

  const plants = useMemo(() => {
    const out = []
    if (state.noArea || state.rows === 0) return out
    const rowGap = d / (state.rows + 1)
    const span = w - 1.4
    const colGap = span / state.perRow
    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.perRow; c += 1) {
        // deterministic jitter so the rows do not look stamped
        const jitter = ((r * 7 + c * 13) % 5) / 5 - 0.5
        out.push({
          x: -span / 2 + colGap * (c + 0.5) + jitter * 0.06,
          z: -d / 2 + rowGap * (r + 1) + jitter * 0.08,
          phase: ((r * 3 + c) % 7) * 0.9,
          vigor: 0.88 + ((r * 5 + c * 11) % 7) / 28, // per-plant size variation, +-12 %
        })
      }
    }
    return out
  }, [state.rows, state.perRow, state.noArea, w, d])

  const plantCount = plants.length
  const leafCount = plantCount * slots.length
  const scale = Math.max(state.canopyScale, 0.16)
  // young canopies show only the first (outer) leaves; the rest unfold as biomass builds up
  const visibleLeaves = Math.max(2, Math.round(slots.length * Math.min(1, 0.25 + scale * 0.85)))
  const color = useMemo(() => leafColor(archetype.leaf, state.health, state.waterDeficit), [archetype.leaf, state.health, state.waterDeficit])
  const droop = state.waterDeficit ? 0.4 : 0 // extra downward tilt under water deficit (illustrative stress cue)
  const extras = archetype.kind === 'vine' ? 'fruit' : archetype.bulb ? 'bulb' : null
  const showExtras = extras === 'fruit' ? state.canopyScale > 0.55 : state.canopyScale > 0.35

  // write instance transforms whenever the state changes (not per frame)
  useEffect(() => {
    const leaves = leavesRef.current
    const stems = stemsRef.current
    if (!leaves || !stems) return
    const baseY = TRAY_Y + 0.085
    plants.forEach((plant, pi) => {
      const s = scale * plant.vigor
      const stemHeight = archetype.kind === 'vine' ? archetype.stem * s : 0.05 * s
      tmpObject.position.set(plant.x, baseY, plant.z)
      tmpObject.rotation.set(0, 0, 0)
      tmpObject.scale.set(s, stemHeight, s)
      tmpObject.updateMatrix()
      stems.setMatrixAt(pi, tmpObject.matrix)

      slots.forEach((slot, li) => {
        const index = pi * slots.length + li
        const visible = li < visibleLeaves
        const yaw = slot.yaw + plant.phase
        const tilt = Math.min(slot.tilt + droop, 1.5)
        tmpObject.position.set(plant.x + Math.sin(yaw) * slot.radial * s, baseY + slot.height * s, plant.z + Math.cos(yaw) * slot.radial * s)
        tmpObject.rotation.set(tilt, yaw, 0, 'YXZ')
        const len = visible ? archetype.length * slot.size * s : 0.0001
        tmpObject.scale.set(len, len, len)
        tmpObject.updateMatrix()
        leaves.setMatrixAt(index, tmpObject.matrix)
        leaves.setColorAt(index, tmpColor.copy(color).offsetHSL(0, 0, ((((pi + li) * 11) % 7) - 3) * 0.012 - (1 - slot.size) * 0.03))
      })

      if (extrasRef.current) {
        const es = showExtras ? s : 0.0001
        if (extras === 'fruit') {
          tmpObject.position.set(plant.x + 0.09 * s, baseY + archetype.stem * 0.55 * s, plant.z + 0.08 * s)
          tmpObject.scale.setScalar(es * 0.07)
        } else {
          tmpObject.position.set(plant.x, baseY + 0.02 * s, plant.z)
          tmpObject.scale.set(es * 0.075, es * 0.06, es * 0.075)
        }
        tmpObject.rotation.set(0, 0, 0)
        tmpObject.updateMatrix()
        extrasRef.current.setMatrixAt(pi, tmpObject.matrix)
      }
    })
    leaves.instanceMatrix.needsUpdate = true
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true
    stems.instanceMatrix.needsUpdate = true
    if (extrasRef.current) extrasRef.current.instanceMatrix.needsUpdate = true
  }, [plants, slots, scale, visibleLeaves, color, droop, archetype, extras, showExtras])

  // very slow, tiny sway so the chamber does not look frozen
  useFrame(({ clock }) => {
    if (reduced || !leavesRef.current) return
    leavesRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.006
  })

  if (plantCount === 0) return null

  return (
    <group>
      <instancedMesh ref={stemsRef} args={[stemGeometry, undefined, plantCount]} key={`stems-${plantCount}`}>
        <meshStandardMaterial color="#5f8a5a" roughness={0.9} />
      </instancedMesh>
      {/* material colour stays white: the per-instance colour carries the crop tint */}
      <instancedMesh ref={leavesRef} args={[leafGeometry, undefined, leafCount]} key={`leaves-${leafCount}-${archetype.width}`}>
        <meshStandardMaterial color="#ffffff" roughness={0.72} side={THREE.DoubleSide} />
      </instancedMesh>
      {extras && (
        <instancedMesh ref={extrasRef} args={[undefined, undefined, plantCount]} key={`${extras}-${plantCount}`}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={extras === 'fruit' ? archetype.fruit : archetype.bulb} roughness={0.55} />
        </instancedMesh>
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* systems: lights, water, sensors, indicators                         */
/* ------------------------------------------------------------------ */

function GrowLights({ light }) {
  const { h, d } = CHAMBER
  const intensity = light
  // horticultural LED bars: a warm-white strip with a subtle red/blue diode pattern, dimmed by the photoperiod
  const white = useMemo(() => new THREE.Color('#fbeed2'), [])
  const red = useMemo(() => new THREE.Color('#ff6a5a'), [])
  const blue = useMemo(() => new THREE.Color('#6aa0ff'), [])
  const strips = [-2.3, -1.15, 0, 1.15, 2.3]
  const stripLength = d - 1.2
  const diodes = 7
  return (
    <group position={[0, h / 2 - 0.14, 0]}>
      {/* light-bar chassis spanning the chamber, with a discreet rail on each end */}
      <mesh>
        <boxGeometry args={[5.4, 0.06, 0.12]} />
        <meshStandardMaterial color="#111a2e" metalness={0.6} roughness={0.45} />
      </mesh>
      {strips.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.32, 0.06, stripLength + 0.16]} />
            <meshStandardMaterial color="#141d33" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.035, 0]}>
            <boxGeometry args={[0.22, 0.01, stripLength]} />
            <meshStandardMaterial color={white} emissive={white} emissiveIntensity={0.08 + intensity * 1.3} toneMapped={false} />
          </mesh>
          {Array.from({ length: diodes }).map((_, i) => {
            const z = -stripLength / 2 + (stripLength * (i + 0.5)) / diodes
            const tint = i % 3 === 1 ? blue : red
            return (
              <mesh key={i} position={[i % 2 === 0 ? -0.06 : 0.06, -0.045, z]}>
                <boxGeometry args={[0.05, 0.008, 0.05]} />
                <meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={0.1 + intensity * 2.2} toneMapped={false} />
              </mesh>
            )
          })}
        </group>
      ))}
      {/* the spot points straight down at the trays (default target is the origin) */}
      <spotLight position={[0, -0.1, 0]} angle={1.1} penumbra={0.6} intensity={4 + intensity * 30} distance={9} color="#fff1dc" />
      {/* faint cool fill so the chamber is never black at 0 h */}
      <pointLight position={[0, -0.5, 0]} intensity={1.5} distance={8} color="#8fb7ff" />
    </group>
  )
}

function WaterManifold({ supply, deficit, rows, reduced }) {
  const { w, d } = CHAMBER
  const color = deficit ? '#e0a83a' : '#5aa9ff'
  const glow = 0.25 + supply * 0.9
  const dropsRef = useRef()
  const rowGap = d / (rows + 1)

  useFrame(({ clock }) => {
    if (reduced || !dropsRef.current) return
    // droplets travel along the main line; speed and brightness follow supply
    const t = (clock.elapsedTime * (0.25 + supply * 0.6)) % 1
    dropsRef.current.position.x = -((w - 1.6) / 2) + t * (w - 1.6)
  })

  return (
    <group>
      {/* main supply line under the trays */}
      <mesh position={[0, TRAY_Y - 0.3, d / 2 - 0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, w - 1.2, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow * 0.5} transparent opacity={0.55 + supply * 0.4} />
      </mesh>
      {/* branch lines to every tray */}
      {Array.from({ length: rows }).map((_, r) => {
        const z = -d / 2 + rowGap * (r + 1)
        const length = d / 2 - 0.35 - z
        return (
          <mesh key={r} position={[(w - 1.4) / 2, TRAY_Y - 0.3, z + length / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, Math.max(length, 0.01), 8]} />
            <meshStandardMaterial color={color} transparent opacity={0.45 + supply * 0.4} />
          </mesh>
        )
      })}
      {/* flow marker */}
      <mesh ref={dropsRef} position={[0, TRAY_Y - 0.3, d / 2 - 0.35]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={supply * 1.5} transparent opacity={supply > 0.02 ? 1 : 0.1} toneMapped={false} />
      </mesh>
      {/* reservoir */}
      <mesh position={[-(w - 1.0) / 2, TRAY_Y - 0.4, d / 2 - 0.35]}>
        <cylinderGeometry args={[0.16, 0.16, 0.5, 14]} />
        <meshStandardMaterial color="#13203a" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-(w - 1.0) / 2, TRAY_Y - 0.4 - 0.25 + 0.25 * supply, d / 2 - 0.35]}>
        <cylinderGeometry args={[0.13, 0.13, Math.max(0.5 * supply, 0.01), 14]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function Sensors({ reduced }) {
  const { w, d } = CHAMBER
  const ref = useRef()
  useFrame(({ clock }) => {
    if (reduced || !ref.current) return
    // slow blink on the monitoring points (sampling cadence, purely decorative)
    const on = Math.sin(clock.elapsedTime * 2.2) > 0.6 ? 1.6 : 0.5
    ref.current.children.forEach((c) => {
      if (c.material) c.material.emissiveIntensity = on
    })
  })
  const points = [
    [-2.4, -0.4, -d / 2 + 0.12],
    [-0.8, -0.4, -d / 2 + 0.12],
    [0.8, -0.4, -d / 2 + 0.12],
    [2.4, -0.4, -d / 2 + 0.12],
    [(w - 0.4) / 2, 0.7, 0.6],
    [-(w - 0.4) / 2, 0.7, -0.6],
  ]
  return (
    <group ref={ref}>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.09, 0.09, 0.05]} />
          <meshStandardMaterial color="#0f2a33" emissive="#22d3ee" emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function IndicatorStrip({ position, color, level, segments = 6, warning = false }) {
  // vertical bar-graph style indicator on the back wall
  const lit = Math.round(level * segments)
  const barColor = warning ? '#f0b13a' : color
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[0.22, 0.14 * segments + 0.1, 0.03]} />
        <meshStandardMaterial color="#0c1426" metalness={0.5} roughness={0.5} />
      </mesh>
      {Array.from({ length: segments }).map((_, i) => {
        const on = i < lit
        const y = -((segments - 1) * 0.14) / 2 + i * 0.14
        return (
          <mesh key={i} position={[0, y, 0.01]}>
            <boxGeometry args={[0.14, 0.09, 0.02]} />
            <meshStandardMaterial
              color={on ? barColor : '#1b2640'}
              emissive={on ? barColor : '#000000'}
              emissiveIntensity={on ? 1.2 : 0}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* camera + scene                                                       */
/* ------------------------------------------------------------------ */

const CAMERA_HOME = { x: 0, y: 0.9, z: 6.9 }
const LOOK_AT = { x: 0, y: -0.45, z: 0 }

function CameraRig({ reduced, orbit }) {
  const invalidate = useThree((s) => s.invalidate)
  const size = useThree((s) => s.size)
  // narrow viewports (tablet / phone) get a longer shot so the whole chamber stays in frame
  const distance = CAMERA_HOME.z * Math.max(1, 2.1 / Math.max(size.width / size.height, 0.5))
  // very slow drift around the chamber; with reduced motion the camera stays put
  useFrame(({ camera, clock }) => {
    const t = reduced || !orbit ? 0 : clock.elapsedTime * 0.06
    camera.position.set(Math.sin(t) * 1.4, CAMERA_HOME.y, distance - Math.abs(Math.sin(t)) * 0.3)
    camera.lookAt(LOOK_AT.x, LOOK_AT.y, LOOK_AT.z)
  })
  useEffect(() => {
    invalidate()
  }, [invalidate])
  return null
}

function Chamber({ state, reduced }) {
  return (
    <group position={[0, -0.05, 0]}>
      <Enclosure />
      <Frame />
      <Trays rows={Math.max(state.rows, 1)} />
      <Plants state={state} reduced={reduced} />
      <GrowLights light={state.light} />
      <WaterManifold supply={state.waterSupply} deficit={state.waterDeficit} rows={Math.max(state.rows, 1)} reduced={reduced} />
      <Sensors reduced={reduced} />
      {/* indicator strips on the back wall: radiation (left), CO2 and O2 (right) */}
      <IndicatorStrip position={[-CHAMBER.w / 2 + 0.45, 0.35, -CHAMBER.d / 2 + 0.12]} color="#f87171" level={state.radiation} warning={state.radiationWarning} />
      <IndicatorStrip position={[CHAMBER.w / 2 - 0.85, 0.35, -CHAMBER.d / 2 + 0.12]} color="#c084fc" level={state.co2Level} />
      <IndicatorStrip position={[CHAMBER.w / 2 - 0.45, 0.35, -CHAMBER.d / 2 + 0.12]} color="#7dd3fc" level={state.gasActivity} />
    </group>
  )
}

export default function GrowthChamberScene({ state, reduced = false, paused = false, orbit = true }) {
  // 'demand' renders only when props change: used for reduced motion and
  // while the panel is scrolled out of view, so the twin never costs frames
  // when nobody is looking at it
  const frameloop = reduced || paused ? 'demand' : 'always'
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.9, 6.9], fov: 38, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      frameloop={frameloop}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#070c18']} />
      <fog attach="fog" args={['#070c18', 9, 16]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#8fb2ff', '#0a0f1c', 0.5]} />
      <directionalLight position={[5, 6, 5]} intensity={0.6} />
      <CameraRig reduced={reduced} orbit={orbit} />
      <Chamber state={state} reduced={reduced} />
    </Canvas>
  )
}
