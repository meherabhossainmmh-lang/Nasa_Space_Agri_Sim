import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * SPACE GROWTH CHAMBER - a small procedural scene rendered with
 * react-three-fiber. It reacts to `state` (see services/twinState.js):
 *
 *   plant size / colour      standing biomass fraction and health
 *   light panels             photoperiod
 *   water lines              supplied share of demand (amber when in deficit)
 *   radiation indicator      dose rate
 *   CO2 / O2 indicators      CO2 setting and gas exchange activity
 *
 * Geometry is deliberately simple (boxes, cylinders, spheres) so it stays
 * cheap on laptops and does not distract from the data.
 */

const CHAMBER = { w: 6, h: 3.2, d: 4 }
const TRAY_Y = -1.15

const CROP_STYLE = {
  lettuce: { leaf: '#4ade80', shape: 'rosette' },
  tomato: { leaf: '#22c55e', shape: 'vine' },
  radish: { leaf: '#34d399', shape: 'rosette' },
}

function healthColor(base, health) {
  // fade from the crop's green towards a pale yellow-green as health drops
  const green = new THREE.Color(base)
  const stressed = new THREE.Color('#a3a34a')
  return green.lerp(stressed, 1 - health).getStyle()
}

function Plant({ position, scale, color, shape, reduced }) {
  const group = useRef()
  useFrame(({ clock }) => {
    if (reduced || !group.current) return
    // very slow sway so the chamber does not look frozen
    group.current.rotation.z = Math.sin(clock.elapsedTime * 0.6 + position[0]) * 0.02
  })
  const s = Math.max(scale, 0.04)
  return (
    <group ref={group} position={position}>
      {/* stem */}
      <mesh position={[0, 0.12 * s, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.25 * s, 6]} />
        <meshStandardMaterial color="#5b8a5b" />
      </mesh>
      {shape === 'vine' ? (
        <>
          <mesh position={[0, 0.35 * s, 0]}>
            <sphereGeometry args={[0.22 * s, 10, 8]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          {s > 0.6 && (
            <mesh position={[0.12 * s, 0.28 * s, 0.1 * s]}>
              <sphereGeometry args={[0.06 * s, 8, 6]} />
              <meshStandardMaterial color="#f87171" roughness={0.5} />
            </mesh>
          )}
        </>
      ) : (
        <mesh position={[0, 0.22 * s, 0]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[0.3 * s, 12, 8]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      )}
    </group>
  )
}

function CropRows({ state, reduced }) {
  const style = CROP_STYLE[state.crop] ?? CROP_STYLE.lettuce
  const color = healthColor(style.leaf, state.health)
  const plants = useMemo(() => {
    const out = []
    if (state.noArea) return out
    const rowGap = CHAMBER.d / (state.rows + 1)
    const colGap = (CHAMBER.w - 1.2) / (state.perRow + 1)
    for (let r = 0; r < state.rows; r += 1) {
      for (let c = 0; c < state.perRow; c += 1) {
        out.push([-(CHAMBER.w - 1.2) / 2 + colGap * (c + 1), TRAY_Y + 0.08, -CHAMBER.d / 2 + rowGap * (r + 1)])
      }
    }
    return out
  }, [state.rows, state.perRow, state.noArea])

  return (
    <group>
      {/* trays */}
      {Array.from({ length: state.rows }).map((_, r) => {
        const rowGap = CHAMBER.d / (state.rows + 1)
        return (
          <mesh key={r} position={[0, TRAY_Y, -CHAMBER.d / 2 + rowGap * (r + 1)]}>
            <boxGeometry args={[CHAMBER.w - 1, 0.12, 0.6]} />
            <meshStandardMaterial color="#1b2a44" metalness={0.3} roughness={0.7} />
          </mesh>
        )
      })}
      {plants.map((p, i) => (
        <Plant key={i} position={p} scale={state.canopyScale} color={color} shape={style.shape} reduced={reduced} />
      ))}
    </group>
  )
}

function LightPanels({ light }) {
  const intensity = 0.15 + light * 1.6
  const panelColor = new THREE.Color('#fef3c7').lerp(new THREE.Color('#fbbf24'), 0.3)
  return (
    <group position={[0, CHAMBER.h / 2 - 0.15, 0]}>
      {[-1.6, 0, 1.6].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[1.3, 0.06, CHAMBER.d - 0.8]} />
          <meshStandardMaterial color={panelColor} emissive={panelColor} emissiveIntensity={light * 0.9} />
        </mesh>
      ))}
      <pointLight position={[0, -0.3, 0]} intensity={intensity * 6} distance={7} color="#fff7db" />
    </group>
  )
}

function WaterLines({ supply, deficit, reduced }) {
  const flow = useRef()
  useFrame(({ clock }) => {
    if (reduced || !flow.current) return
    flow.current.position.x = ((clock.elapsedTime * 0.8) % 1) * (CHAMBER.w - 1.4) - (CHAMBER.w - 1.4) / 2
  })
  const color = deficit ? '#fbbf24' : '#60a5fa'
  const opacity = 0.25 + supply * 0.7
  return (
    <group position={[0, TRAY_Y - 0.25, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, CHAMBER.w - 1.2, 8]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} emissive={color} emissiveIntensity={0.3 * supply} />
      </mesh>
      {/* moving droplet indicating flow; dim when supply is short */}
      <mesh ref={flow}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={supply} transparent opacity={supply > 0 ? 1 : 0.15} />
      </mesh>
      {/* risers to the trays */}
      {[-1.8, 0, 1.8].map((x) => (
        <mesh key={x} position={[x, 0.15, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
          <meshStandardMaterial color={color} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  )
}

function Indicator({ position, color, level, label, reduced }) {
  const mesh = useRef()
  useFrame(({ clock }) => {
    if (!mesh.current) return
    const pulse = reduced ? 1 : 0.85 + 0.15 * Math.sin(clock.elapsedTime * (1 + level * 2))
    mesh.current.material.emissiveIntensity = (0.2 + level * 1.4) * pulse
  })
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.3, 0.5, 0.12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh ref={mesh} position={[0, 0, 0.07]}>
        <boxGeometry args={[0.18, 0.1 + level * 0.28, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, -0.34, 0]} userData={{ label }}>
        <boxGeometry args={[0.26, 0.04, 0.04]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </group>
  )
}

function Chamber() {
  return (
    <group>
      {/* floor */}
      <mesh position={[0, -CHAMBER.h / 2, 0]} receiveShadow>
        <boxGeometry args={[CHAMBER.w, 0.1, CHAMBER.d]} />
        <meshStandardMaterial color="#0b1222" metalness={0.2} roughness={0.9} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 0, -CHAMBER.d / 2]}>
        <boxGeometry args={[CHAMBER.w, CHAMBER.h, 0.08]} />
        <meshStandardMaterial color="#0d162b" roughness={0.9} />
      </mesh>
      {/* frame edges */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(CHAMBER.w, CHAMBER.h, CHAMBER.d)]} />
        <lineBasicMaterial color="#27365a" />
      </lineSegments>
      {/* monitoring points along the back wall */}
      {[-2.4, -0.8, 0.8, 2.4].map((x) => (
        <mesh key={x} position={[x, -0.4, -CHAMBER.d / 2 + 0.08]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function CameraRig({ reduced }) {
  useFrame(({ camera, clock }) => {
    if (reduced) return
    const t = clock.elapsedTime * 0.08
    camera.position.x = Math.sin(t) * 1.2
    camera.lookAt(0, -0.4, 0)
  })
  return null
}

export default function GrowthChamberScene({ state, reduced = false, paused = false }) {
  // 'demand' renders only when props change: used for reduced motion and
  // while the panel is scrolled out of view, so the twin never costs frames
  // when nobody is looking at it
  const frameloop = reduced || paused ? 'demand' : 'always'
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.2, 7.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      frameloop={frameloop}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 4]} intensity={0.5} />
      <CameraRig reduced={reduced} />
      <Chamber />
      <LightPanels light={state.light} />
      <CropRows state={state} reduced={reduced} />
      <WaterLines supply={state.waterSupply} deficit={state.waterDeficit} reduced={reduced} />
      <Indicator position={[-CHAMBER.w / 2 + 0.35, 0.7, -CHAMBER.d / 2 + 0.2]} color="#f87171" level={state.radiation} label="radiation" reduced={reduced} />
      <Indicator position={[CHAMBER.w / 2 - 0.95, 0.7, -CHAMBER.d / 2 + 0.2]} color="#c084fc" level={state.co2Level} label="co2" reduced={reduced} />
      <Indicator position={[CHAMBER.w / 2 - 0.35, 0.7, -CHAMBER.d / 2 + 0.2]} color="#7dd3fc" level={state.gasActivity * state.canopyScale} label="o2" reduced={reduced} />
    </Canvas>
  )
}
