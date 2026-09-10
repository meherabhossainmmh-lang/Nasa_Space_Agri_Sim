import ControlPanel from '../components/ControlPanel.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import MetricsGrid from '../components/MetricsGrid.jsx'
import GrowthPanel from '../components/GrowthPanel.jsx'
import LifeSupportPanel from '../components/LifeSupportPanel.jsx'
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
        <section className="space-y-6">
          {error && (
            <p className="rounded-xl border border-neon-rose/40 bg-neon-rose/10 px-4 py-3 text-sm text-neon-rose">
              {error.message}
            </p>
          )}
          <MetricsGrid result={result} isLoading={isLoading} />
          <GrowthPanel result={result} />
          <LifeSupportPanel result={result} />
        </section>
      </div>
    </main>
  )
}
