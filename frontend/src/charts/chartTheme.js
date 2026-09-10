/**
 * Shared look for every Recharts chart so they all match the dashboard.
 */
export const CHART_COLORS = {
  earth: '#60a5fa', // neon blue
  space: '#4ade80', // neon green
  waterUsed: '#38bdf8',
  waterRecovered: '#22d3ee',
  co2: '#a78bfa',
  o2: '#fbbf24',
  grid: '#1a2248',
  axis: '#64748b',
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
    background: 'rgba(7, 11, 26, 0.95)',
    border: '1px solid #2a3564',
    borderRadius: 12,
    fontSize: 12,
    color: '#e2e8f0',
  },
  labelStyle: { color: '#94a3b8', marginBottom: 4 },
  itemStyle: { padding: 0 },
  cursor: { stroke: '#2a3564' },
}

export const legendProps = {
  iconType: 'plainline',
  wrapperStyle: { fontSize: 12, color: '#cbd5e1', paddingTop: 8 },
}
