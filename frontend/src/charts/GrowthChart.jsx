import { Area, AreaChart, CartesianGrid, Legend, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_COLORS, axisProps, gridProps, legendProps, tooltipStyle } from './chartTheme.js'
import { formatMass } from '../services/formatters.js'

/**
 * Earth vs space biomass over the simulated period.
 *
 * `mode` = 'standing'   -> biomass currently growing (drops to ~0 after a harvest)
 * `mode` = 'harvested'  -> cumulative harvested yield (steps up on harvest days)
 * `mode` = 'total'      -> standing + harvested (never decreases)
 */
export default function GrowthChart({ data = [], mode = 'standing', harvest, compact = false }) {
  const keys = {
    standing: { earth: 'earthBiomass', space: 'spaceBiomass' },
    harvested: { earth: 'earthHarvested', space: 'spaceHarvested' },
    total: { earth: 'earthCumulative', space: 'spaceCumulative' },
  }[mode] ?? { earth: 'earthBiomass', space: 'spaceBiomass' }

  const lastDay = data.length ? data[data.length - 1].day : 0
  const harvestDays = harvest?.harvestDays ?? []
  const last = data.length ? data[data.length - 1] : null

  return (
    <div className={compact ? 'h-56 w-full' : 'h-72 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 14, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="earthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.earth} stopOpacity={0.28} />
              <stop offset="100%" stopColor={CHART_COLORS.earth} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="spaceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.space} stopOpacity={0.32} />
              <stop offset="100%" stopColor={CHART_COLORS.space} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="day"
            type="number"
            domain={[0, 'dataMax']}
            {...axisProps}
            label={{ value: 'Mission day', position: 'insideBottom', offset: -2, fill: CHART_COLORS.axisLabel, fontSize: 10 }}
            height={34}
          />
          <YAxis
            {...axisProps}
            width={62}
            tickFormatter={(v) => formatMass(v)}
            label={{ value: 'Biomass (fresh weight)', angle: -90, position: 'insideLeft', offset: 14, fill: CHART_COLORS.axisLabel, fontSize: 10 }}
          />
          <Tooltip
            {...tooltipStyle}
            formatter={(value, name) => [formatMass(value), name]}
            labelFormatter={(day) => {
              const row = data.find((d) => d.day === day)
              const extra = row ? ` · cycle ${row.cycle}, day ${row.dayInCycle}${row.isHarvestDay ? ' · harvest' : ''}` : ''
              return `Day ${day}${extra}`
            }}
          />
          <Legend {...legendProps} />
          {harvestDays.map((day) => (
            <ReferenceLine
              key={day}
              x={day}
              stroke={CHART_COLORS.harvest}
              strokeDasharray="4 3"
              label={{ value: 'harvest', position: 'insideTopLeft', fill: CHART_COLORS.harvest, fontSize: 10 }}
            />
          ))}
          <ReferenceLine
            x={lastDay}
            stroke={CHART_COLORS.current}
            strokeOpacity={0.7}
            label={{ value: `end · day ${lastDay}`, position: 'insideTopRight', fill: CHART_COLORS.current, fontSize: 10 }}
          />
          <Area
            type="monotone"
            dataKey={keys.earth}
            name="Earth reference"
            stroke={CHART_COLORS.earth}
            strokeWidth={1.75}
            fill="url(#earthFill)"
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey={keys.space}
            name="Space scenario"
            stroke={CHART_COLORS.space}
            strokeWidth={2}
            fill="url(#spaceFill)"
            dot={false}
            isAnimationActive={false}
          />
          {last && <ReferenceDot x={last.day} y={last[keys.space]} r={3.5} fill={CHART_COLORS.space} stroke={CHART_COLORS.bg} strokeWidth={1.5} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
