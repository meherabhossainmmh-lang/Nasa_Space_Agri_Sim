/**
 * Shared look for every Recharts chart so they all match the dashboard.
 * Colour meaning follows the design tokens in styles/index.css.
 */
export const CHART_COLORS = {
  earth: '#93c5fd',
  space: '#4ade80',
  waterDemand: '#94a3b8',
  waterSupplied: '#60a5fa',
  waterDeficit: '#fbbf24',
  waterRecovered: '#22d3ee',
  co2: '#c084fc',
  o2: '#7dd3fc',
  harvest: '#4ade80',
  current: '#22d3ee',
  grid: '#142038',
  axis: '#64748b',
  axisLabel: '#7c8aa5',
  bg: '#080d1a',
}

export const axisProps = {
  stroke: CHART_COLORS.axis,
  tick: { fill: '#94a3b8', fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART_COLORS.grid },
}

export const gridProps = {
  stroke: CHART_COLORS.grid,
  strokeDasharray: '3 3',
  vertical: false,
}

export const tooltipStyle = {
  contentStyle: {
    background: 'rgba(8, 13, 26, 0.96)',
    border: '1px solid #27365a',
    borderRadius: 6,
    fontSize: 12,
    color: '#e2e8f0',
    fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
  },
  labelStyle: { color: '#94a3b8', marginBottom: 4 },
  itemStyle: { padding: 0 },
  cursor: { stroke: '#27365a' },
}

export const legendProps = {
  iconType: 'plainline',
  wrapperStyle: { fontSize: 11, color: '#cbd5e1', paddingTop: 6 },
}
