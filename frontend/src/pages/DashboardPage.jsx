import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import Starfield from '../components/Starfield.jsx'
import ControlPanel from '../components/ControlPanel.jsx'
import MetricsGrid from '../components/MetricsGrid.jsx'
import ComparisonPanel from '../components/ComparisonPanel.jsx'
import GrowthPanel from '../components/GrowthPanel.jsx'
import LifeSupportPanel from '../components/LifeSupportPanel.jsx'
import { useSimulationParams } from '../hooks/useSimulationParams.js'
import { useSimulation } from '../hooks/useSimulation.js'
import { useSimulationConfig } from '../hooks/useSimulationConfig.js'

/**
 * Main (and only) page of the Phase 1 dashboard.
 *
 * Layout:  header on top, controls on the left, results on the right
 *          (metric cards -> comparison -> charts). On small screens the
 *          columns stack, controls first.
 */
export default function DashboardPage() {
  const { config } = useSimulationConfig()
  const { params, setParam, resetParams } = useSimulationParams(config)
  const { result, error, isLoading } = useSimulation(params)

  return (
    <div className="min-h-screen text-slate-200">
      <Starfield />
      <Header isLoading={isLoading} error={error} />

      <main className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-[76px] lg:self-start">
          <ControlPanel config={config} params={params} onChange={setParam} onReset={resetParams} />
        </aside>

        <section className="min-w-0 space-y-6" aria-live="polite">
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-neon-rose/40 bg-neon-rose/10 px-4 py-3 text-sm text-neon-rose">
              <span aria-hidden="true">⚠️</span>
              <div>
                <p className="font-medium">Simulation unavailable</p>
                <p className="text-neon-rose/80">{error.message}</p>
              </div>
            </div>
          )}

          <MetricsGrid result={result} isLoading={isLoading} />

          <ComparisonPanel
            result={result}
            mode={params.earthComparisonMode}
            onModeChange={(mode) => setParam('earthComparisonMode', mode)}
          />

          <div className="grid gap-6 2xl:grid-cols-2">
            <GrowthPanel result={result} />
            <LifeSupportPanel result={result} />
          </div>
        </section>
      </main>

      <Footer disclaimer={result?.disclaimer ?? config.disclaimer} />
    </div>
  )
}
