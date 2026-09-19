import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_COLORS, axisProps, gridProps, legendProps, tooltipStyle } from './chartTheme.js'
import { formatMass, formatVolume } from '../services/formatters.js'

/**
 * Two single-axis charts instead of one dual-axis chart:
 *
 *   WaterLoopChart   demand / supplied / deficit / recovered (litres)
 *   AtmosphereChart  CO2 removed / O2 produced (grams)
 *
 * `mode` = 'daily' | 'cumulative'
 */
const WATER_KEYS = {
  daily: { demand: 'waterDemand', supplied: 'waterUsed', deficit: 'waterDeficit', recovered: 'waterRecovered' },
  cumulative: {
    demand: 'cumulativeWaterDemand',
    supplied: 'cumulativeWaterUsed',
    deficit: 'cumulativeWaterDeficit',
    recovered: 'cumulativeWaterRecovered',
  },
}

const GAS_KEYS = {
  daily: { co2: 'co2Removed', o2: 'o2Produced' },
  cumulative: { co2: 'cumulativeCo2Removed', o2: 'cumulativeO2Produced' },
}

const xAxis = (
  <XAxis
    dataKey="day"
    type="number"
    domain={[0, 'dataMax']}
    {...axisProps}
    label={{ value: 'Mission day', position: 'insideBottom', offset: -2, fill: CHART_COLORS.axisLabel, fontSize: 10 }}
    height={34}
  />
)

export function WaterLoopChart({ data = [], mode = 'daily', height = 'h-56' }) {
  const k = WATER_KEYS[mode] ?? WATER_KEYS.daily
  const hasDeficit = data.some((d) => d[k.deficit] > 0)
  const unit = mode === 'daily' ? 'L/day' : 'L'
  return (
    <div className={`${height} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 14, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="suppliedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.waterSupplied} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS.waterSupplied} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="deficitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.waterDeficit} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.waterDeficit} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          {xAxis}
          <YAxis
            {...axisProps}
            width={58}
            tickFormatter={(v) => formatVolume(v)}
            label={{ value: `Water (${unit})`, angle: -90, position: 'insideLeft', offset: 16, fill: CHART_COLORS.axisLabel, fontSize: 10 }}
          />
          <Tooltip {...tooltipStyle} formatter={(value, name) => [formatVolume(value), name]} labelFormatter={(day) => `Day ${day}`} />
          <Legend {...legendProps} />
          <Area type="monotone" dataKey={k.demand} name="Demand" stroke={CHART_COLORS.waterDemand} strokeDasharray="4 3" strokeWidth={1.5} fill="none" dot={false} isAnimationActive={false} />
          <Area type="monotone" dataKey={k.supplied} name="Supplied" stroke={CHART_COLORS.waterSupplied} strokeWidth={2} fill="url(#suppliedFill)" dot={false} isAnimationActive={false} />
          {hasDeficit && (
            <Area type="monotone" dataKey={k.deficit} name="Deficit (unmet)" stroke={CHART_COLORS.waterDeficit} strokeWidth={1.75} fill="url(#deficitFill)" dot={false} isAnimationActive={false} />
          )}
          <Area type="monotone" dataKey={k.recovered} name="Est. recovery" stroke={CHART_COLORS.waterRecovered} strokeWidth={1.5} fill="none" dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AtmosphereChart({ data = [], mode = 'daily', height = 'h-56' }) {
  const k = GAS_KEYS[mode] ?? GAS_KEYS.daily
  const unit = mode === 'daily' ? 'g/day' : 'g'
  return (
    <div className={`${height} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 14, left: 4, bottom: 4 }}>
          <CartesianGrid {...gridProps} />
          {xAxis}
          <YAxis
            {...axisProps}
            width={58}
            tickFormatter={(v) => formatMass(v)}
            label={{ value: `Gas (${unit})`, angle: -90, position: 'insideLeft', offset: 16, fill: CHART_COLORS.axisLabel, fontSize: 10 }}
          />
          <Tooltip {...tooltipStyle} formatter={(value, name) => [formatMass(value), name]} labelFormatter={(day) => `Day ${day}`} />
          <Legend {...legendProps} />
          <Line type="monotone" dataKey={k.co2} name="CO₂ removed" stroke={CHART_COLORS.co2} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey={k.o2} name="O₂ produced" stroke={CHART_COLORS.o2} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
