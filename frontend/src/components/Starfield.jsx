import { useMemo } from 'react'

/**
 * Decorative background: a few dozen tiny stars plus a soft nebula glow.
 * Pure CSS/SVG, no external assets, fixed behind the content.
 */
export default function Starfield({ count = 90 }) {
  const stars = useMemo(() => {
    // deterministic pseudo-random so the sky doesn't reshuffle on re-render
    let seed = 42
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      r: 0.4 + rand() * 1.1,
      o: 0.25 + rand() * 0.6,
    }))
  }, [count])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 top-[-10%] h-[45rem] w-[45rem] rounded-full bg-neon-cyan/10 blur-[140px]" />
      <div className="absolute -right-40 bottom-[-20%] h-[40rem] w-[40rem] rounded-full bg-neon-purple/10 blur-[140px]" />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {stars.map((s) => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#e2e8f0" opacity={s.o} />
        ))}
      </svg>
    </div>
  )
}
