import { Component } from 'react'

/**
 * Last line of defence: if a render throws (e.g. an unexpected API shape),
 * show a recoverable message instead of a blank page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Dashboard crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-space-950 p-6 text-slate-200">
        <div className="max-w-md rounded-2xl border border-neon-rose/40 bg-space-900 p-6 text-center">
          <p className="text-3xl" aria-hidden="true">
            🛰️
          </p>
          <h1 className="mt-2 text-lg font-semibold">Something went wrong</h1>
          <p className="mt-1 text-sm text-slate-400">{String(this.state.error?.message || this.state.error)}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 rounded-lg border border-neon-cyan/50 px-4 py-1.5 text-sm text-neon-cyan hover:bg-neon-cyan/10"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
}
