/**
 * Glassy card container used across the dashboard.
 */
export default function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-space-700/70 bg-space-900/70 shadow-[0_0_40px_-20px_rgba(34,211,238,0.35)] backdrop-blur ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-x-3 gap-y-2 border-b border-space-700/60 px-5 py-3 max-md:flex-wrap">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan/90">{title}</h2>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}
