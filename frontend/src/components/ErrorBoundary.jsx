import { Component } from 'react'

/**
 * Last line of defence: if a render throws (e.g. an unexpected API shape),
 * show a recoverable system alert instead of a blank page.
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
    console.error('Dashboard crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-space-950 p-6 text-slate-200">
        <div className="w-full max-w-md rounded-lg border border-danger/50 bg-space-900 p-6" role="alert">
          <p className="font-mono text-[11px] tracking-[0.18em] text-danger">DASHBOARD ERROR</p>
          <h1 className="mt-2 text-lg font-semibold">Something went wrong while rendering</h1>
          <p className="mt-1 break-words text-sm text-slate-400">{String(this.state.error?.message || this.state.error)}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 rounded border border-accent/50 px-4 py-1.5 font-mono text-[11px] tracking-wider text-accent transition-colors hover:bg-accent/10"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    )
  }
}
