import { useCallback, useState } from 'react'
import MissionHeader from '../components/MissionHeader.jsx'
import MissionOverview from '../components/MissionOverview.jsx'
import MissionControls from '../components/MissionControls.jsx'
import MetricSummary from '../components/MetricSummary.jsx'
import EarthSpaceComparison from '../components/EarthSpaceComparison.jsx'
import MissionInsight from '../components/MissionInsight.jsx'
import GrowthPanel from '../components/GrowthPanel.jsx'
import LifeSupportPanel from '../components/LifeSupportPanel.jsx'
import DigitalTwin3D from '../components/DigitalTwin3D.jsx'
import ModelAssumptions from '../components/ModelAssumptions.jsx'
import SystemAlert from '../components/SystemAlert.jsx'
import Footer from '../components/Footer.jsx'
import Starfield from '../components/Starfield.jsx'
import { useSimulationParams } from '../hooks/useSimulationParams.js'
import { useSimulation } from '../hooks/useSimulation.js'
import { useSimulationConfig } from '../hooks/useSimulationConfig.js'

/**
 * Main (and only) page of the Phase 1 dashboard.
 *
 * Progressive disclosure, top to bottom:
 *   1. identity + mission overview + controls + snapshot + Earth vs space
 *   2. insight / what-if, growth, life support, 3D chamber
 *   3. model assumptions and status
 * On large screens the controls sit in a sticky left column.
 */
export default function DashboardPage() {
  const { config } = useSimulationConfig()
  const { params, setParam, resetParams } = useSimulationParams(config)
  const { result, error, isLoading, retry } = useSimulation(params)

  // pinned scenario for the what-if comparison
  const [baseline, setBaseline] = useState(null)
  const pinBaseline = useCallback(() => {
    if (result) setBaseline({ params, result })
  }, [params, result])
  const clearBaseline = useCallback(() => setBaseline(null), [])

  return (
    <div className="min-h-screen text-slate-200">
      <Starfield />
      <MissionHeader isLoading={isLoading} error={error} hasResult={Boolean(result)} />

      <main className="mx-auto max-w-[1600px] space-y-4 px-3 py-4 sm:px-6 sm:py-5">
        <MissionOverview params={params} config={config} result={result} />

        <div className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)] xl:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="min-w-0 lg:sticky lg:top-[64px] lg:self-start">
            <MissionControls config={config} params={params} onChange={setParam} onReset={resetParams} isLoading={isLoading} />
          </aside>

          <section className="min-w-0 space-y-4" aria-live="polite" aria-busy={isLoading || undefined}>
            {error && <SystemAlert error={error} onRetry={retry} />}

            <MetricSummary result={result} isLoading={isLoading} />

            <EarthSpaceComparison
              result={result}
              mode={params.earthComparisonMode}
              onModeChange={(mode) => setParam('earthComparisonMode', mode)}
            />

            <MissionInsight
              result={result}
              params={params}
              config={config}
              baseline={baseline}
              onPinBaseline={pinBaseline}
              onClearBaseline={clearBaseline}
            />

            <div className="grid gap-4 2xl:grid-cols-2">
              <GrowthPanel result={result} />
              <LifeSupportPanel result={result} />
            </div>

            <DigitalTwin3D result={result} />

            <ModelAssumptions
              assumptions={config.assumptions}
              modelStatus={config.modelStatus}
              disclaimer={result?.disclaimer ?? config.disclaimer}
            />
          </section>
        </div>
      </main>

      <Footer disclaimer={result?.disclaimer ?? config.disclaimer} />
    </div>
  )
}
