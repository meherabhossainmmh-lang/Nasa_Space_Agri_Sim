import MetricCard from './MetricCard.jsx'
import { formatMass, formatNumber, formatPercent, formatVolume } from '../services/formatters.js'

/**
 * The six headline metrics for the current space scenario.
 * All numbers come straight from the API response - no maths in here.
 */
export default function MetricsGrid({ result, isLoading }) {
  const r = result
  const diffPercent = r?.comparison?.differencePercent
  const diffTone = diffPercent == null ? undefined : diffPercent < -0.05 ? 'bad' : diffPercent > 0.05 ? 'good' : 'neutral'
  const recoveryPercent =
    r && r.waterUsed > 0 ? (100 * r.waterRecovered) / r.waterUsed : r?.lifeSupport?.waterRecoveryEfficiency * 100

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        icon="🌱"
        label="Crop yield"
        tone="green"
        value={r ? formatMass(r.cropYield) : '–'}
        delta={r ? `${formatNumber(r.growthRate, 1)} g/day` : undefined}
        hint={r ? `${r.crop.cyclesCompleted} harvest${r.crop.cyclesCompleted === 1 ? '' : 's'}` : undefined}
        isLoading={isLoading}
      />
      <MetricCard
        icon="💧"
        label="Water used"
        tone="blue"
        value={r ? formatVolume(r.waterUsed) : '–'}
        hint={r ? `${formatNumber(r.waterUsed / Math.max(r.inputs.simulationDays, 1), 1)} L/day avg` : undefined}
        isLoading={isLoading}
      />
      <MetricCard
        icon="♻️"
        label="Water recovered"
        tone="cyan"
        value={r ? formatVolume(r.waterRecovered) : '–'}
        delta={r ? `${formatNumber(recoveryPercent, 0)}% recycled` : undefined}
        deltaTone="good"
        isLoading={isLoading}
      />
      <MetricCard
        icon="💨"
        label="CO₂ removed"
        tone="purple"
        value={r ? formatMass(r.co2Removed) : '–'}
        hint={r ? `≈ ${formatNumber(r.lifeSupport.crewCo2DaysRemoved, 1)} crew-days` : undefined}
        isLoading={isLoading}
      />
      <MetricCard
        icon="🫧"
        label="Est. O₂ produced"
        tone="amber"
        value={r ? formatMass(r.estimatedOxygenProduced) : '–'}
        hint={r ? `≈ ${formatNumber(r.lifeSupport.crewO2DaysSupported, 1)} crew-days` : undefined}
        isLoading={isLoading}
      />
      <MetricCard
        icon="🌍"
        label="Space vs Earth"
        tone={diffTone === 'bad' ? 'rose' : 'green'}
        value={r ? formatPercent(r.spaceGrowthPercentage, { digits: 0 }) : '–'}
        unit={r ? 'of Earth' : undefined}
        delta={r ? `${formatPercent(diffPercent, { signed: true })} yield` : undefined}
        deltaTone={diffTone}
        isLoading={isLoading}
      />
    </div>
  )
}
