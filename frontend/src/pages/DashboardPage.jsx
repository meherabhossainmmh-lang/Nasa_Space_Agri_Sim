import ControlPanel from '../components/ControlPanel.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useSimulationParams } from '../hooks/useSimulationParams.js'
import { useSimulation } from '../hooks/useSimulation.js'
import { useSimulationConfig } from '../hooks/useSimulationConfig.js'

/**
 * Main (and only) page of the Phase 1 dashboard.
 */
export default function DashboardPage() {
  const { config } = useSimulationConfig()
  const { params, setParam, resetParams } = useSimulationParams(config)
  const { result, error, isLoading } = useSimulation(params)

  return (
    <main className="min-h-screen bg-space-950 text-slate-200">
      <header className="flex items-center justify-between border-b border-space-700 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-wide text-neon-cyan">SpaceAgriSim</h1>
          <p className="text-sm text-slate-400">Space Agriculture &amp; Life Support Simulator — Phase 1 prototype</p>
        </div>
        <StatusBadge isLoading={isLoading} error={error} />
      </header>

      <div className="grid gap-6 p-6 lg:grid-cols-[360px_1fr]">
        <ControlPanel config={config} params={params} onChange={setParam} onReset={resetParams} />
        <section className="rounded-2xl border border-space-700/70 bg-space-900/70 p-5 font-mono text-xs text-slate-400">
          {error && <p className="text-neon-rose">{error.message}</p>}
          {result && (
            <pre>
              {JSON.stringify(
                {
                  cropYield: result.cropYield,
                  growthRate: result.growthRate,
                  waterUsed: result.waterUsed,
                  waterRecovered: result.waterRecovered,
                  co2Removed: result.co2Removed,
                  estimatedOxygenProduced: result.estimatedOxygenProduced,
                  spaceGrowthPercentage: result.spaceGrowthPercentage,
                  comparison: result.comparison,
                },
                null,
                2,
              )}
            </pre>
          )}
        </section>
      </div>
    </main>
  )
}
