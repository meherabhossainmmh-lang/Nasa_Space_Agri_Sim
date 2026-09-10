import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_COLORS, axisProps, gridProps, legendProps, tooltipStyle } from './chartTheme.js'
import { formatMass } from '../services/formatters.js'

/**
 * Earth vs space biomass over the simulated period.
 *
 * `mode` = 'standing'   -> biomass currently growing (resets at each harvest)
 * `mode` = 'cumulative' -> total produced so far (keeps climbing across harvests)
 */
export default function GrowthChart({ data = [], mode = 'standing', cycleLengthDays }) {
  const earthKey = mode === 'cumulative' ? 'earthCumulative' : 'earthBiomass'
  const spaceKey = mode === 'cumulative' ? 'spaceCumulative' : 'spaceBiomass'

  const lastDay = data.length ? data[data.length - 1].day : 0
  const harvestDays = []
  if (cycleLengthDays) {
    for (let d = cycleLengthDays; d < lastDay; d += cycleLengthDays) harvestDays.push(d)
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="earthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.earth} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.earth} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="spaceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.space} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS.space} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="day"
            type="number"
            domain={[0, 'dataMax']}
            {...axisProps}
            label={{ value: 'Day', position: 'insideBottomRight', offset: -4, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            {...axisProps}
            width={64}
            tickFormatter={(v) => formatMass(v)}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value, name) => [formatMass(value), name]}
            labelFormatter={(day) => `Day ${day}`}
          />
          <Legend {...legendProps} />
          {harvestDays.map((day) => (
            <ReferenceLine
              key={day}
              x={day}
              stroke="#334155"
              strokeDasharray="4 4"
              label={{ value: 'harvest', position: 'top', fill: '#64748b', fontSize: 10 }}
            />
          ))}
          <Area
            type="monotone"
            dataKey={earthKey}
            name="Earth"
            stroke={CHART_COLORS.earth}
            strokeWidth={2}
            fill="url(#earthFill)"
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey={spaceKey}
            name="Space"
            stroke={CHART_COLORS.space}
            strokeWidth={2}
            fill="url(#spaceFill)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
