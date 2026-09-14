import { useMemo } from 'react'

/**
 * Deterministic pseudo-random star positions so the sky never reshuffles.
 * Lives outside the component because it is pure and has no React state.
 */
function generateStars(count, seed = 42) {
  let state = seed
  const rand = () => {
    state = (state * 9301 + 49297) % 233280
    return state / 233280
  }
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rand() * 100,
    y: rand() * 100,
    r: 0.3 + rand() * 0.9,
    o: 0.15 + rand() * 0.45,
  }))
}

/**
 * Decorative background: a sparse star field over a deep-space gradient.
 * Pure CSS/SVG, fixed behind the content, intentionally subtle.
 */
export default function Starfield({ count = 110 }) {
  const stars = useMemo(() => generateStars(count), [count])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,40,70,0.55),rgba(4,7,15,0)_55%),radial-gradient(ellipse_at_bottom_right,rgba(16,50,60,0.35),rgba(4,7,15,0)_50%)]" />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {stars.map((s) => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#dbe4f0" opacity={s.o} />
        ))}
      </svg>
    </div>
  )
}
