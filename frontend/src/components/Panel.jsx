/**
 * Panel container used across the dashboard: dark navy surface, thin
 * technical border, small uppercase title. Deliberately quiet so the data
 * carries the visual weight.
 *
 * `eyebrow` is an optional tiny tag rendered before the title (e.g. "01").
 * `padded={false}` lets charts and 3D views bleed to the edges.
 */
export default function Panel({
  title,
  subtitle,
  eyebrow,
  action,
  children,
  className = '',
  bodyClassName = '',
  padded = true,
  id,
  ...rest
}) {
  return (
    <section
      id={id}
      className={`relative rounded-lg border border-line bg-space-900/85 shadow-panel backdrop-blur-sm ${className}`}
      {...rest}
    >
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-line px-4 py-2.5 sm:px-5">
          <div className="min-w-0 flex-1 basis-[14rem]">
            {title && (
              <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/90">
                {eyebrow && <span className="font-mono text-[10px] text-slate-500">{eyebrow}</span>}
                <span className="truncate">{title}</span>
              </h2>
            )}
            {subtitle && <p className="mt-0.5 text-xs leading-snug text-slate-400">{subtitle}</p>}
          </div>
          {action && <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={`${padded ? 'p-4 sm:p-5' : ''} ${bodyClassName}`}>{children}</div>
    </section>
  )
}
