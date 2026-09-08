import ControlPanel from '../components/ControlPanel.jsx'
import { useSimulationParams } from '../hooks/useSimulationParams.js'
import { DEFAULT_CONFIG } from '../services/defaultConfig.js'

/**
 * Main (and only) page of the Phase 1 dashboard.
 */
export default function DashboardPage() {
  const config = DEFAULT_CONFIG
  const { params, setParam, resetParams } = useSimulationParams(config)

  return (
    <main className="min-h-screen bg-space-950 text-slate-200">
      <header className="border-b border-space-700 px-6 py-4">
        <h1 className="text-xl font-semibold tracking-wide text-neon-cyan">SpaceAgriSim</h1>
        <p className="text-sm text-slate-400">Space Agriculture &amp; Life Support Simulator — Phase 1 prototype</p>
      </header>

      <div className="grid gap-6 p-6 lg:grid-cols-[360px_1fr]">
        <ControlPanel config={config} params={params} onChange={setParam} onReset={resetParams} />
        <section className="rounded-2xl border border-space-700/70 bg-space-900/70 p-5 text-sm text-slate-400">
          Selected crop: <span className="text-slate-200">{params.crop}</span>
        </section>
      </div>
    </main>
  )
}
