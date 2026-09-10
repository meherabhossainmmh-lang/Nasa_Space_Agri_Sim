import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_COLORS, axisProps, gridProps, legendProps, tooltipStyle } from './chartTheme.js'
import { formatMass, formatVolume } from '../services/formatters.js'

/**
 * Water used / recovered (litres, left axis) and CO2 removed / O2 produced
 * (grams, right axis) over the simulated period.
 *
 * `mode` = 'daily'      -> per-day values
 * `mode` = 'cumulative' -> running totals
 */
const SERIES = {
  daily: {
    waterUsed: 'waterUsed',
    waterRecovered: 'waterRecovered',
    co2: 'co2Removed',
    o2: 'o2Produced',
  },
  cumulative: {
    waterUsed: 'cumulativeWaterUsed',
    waterRecovered: 'cumulativeWaterRecovered',
    co2: 'cumulativeCo2Removed',
    o2: 'cumulativeO2Produced',
  },
}

export default function LifeSupportChart({ data = [], mode = 'daily', visible }) {
  const keys = SERIES[mode] ?? SERIES.daily
  const show = (name) => !visible || visible[name] !== false

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="day"
            type="number"
            domain={[0, 'dataMax']}
            {...axisProps}
            label={{ value: 'Day', position: 'insideBottomRight', offset: -4, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            yAxisId="water"
            {...axisProps}
            width={60}
            tickFormatter={(v) => formatVolume(v)}
            label={{ value: 'Water', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            yAxisId="gas"
            orientation="right"
            {...axisProps}
            width={64}
            tickFormatter={(v) => formatMass(v)}
            label={{ value: 'Gas', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 11 }}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value, name, item) => [
              item?.yAxisId === 'water' ? formatVolume(value) : formatMass(value),
              name,
            ]}
            labelFormatter={(day) => `Day ${day}`}
          />
          <Legend {...legendProps} />
          {show('waterUsed') && (
            <Line
              yAxisId="water"
              type="monotone"
              dataKey={keys.waterUsed}
              name="Water used"
              stroke={CHART_COLORS.waterUsed}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}
          {show('waterRecovered') && (
            <Line
              yAxisId="water"
              type="monotone"
              dataKey={keys.waterRecovered}
              name="Water recovered"
              stroke={CHART_COLORS.waterRecovered}
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              isAnimationActive={false}
            />
          )}
          {show('co2') && (
            <Line
              yAxisId="gas"
              type="monotone"
              dataKey={keys.co2}
              name="CO₂ removed"
              stroke={CHART_COLORS.co2}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}
          {show('o2') && (
            <Line
              yAxisId="gas"
              type="monotone"
              dataKey={keys.o2}
              name="O₂ produced"
              stroke={CHART_COLORS.o2}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
