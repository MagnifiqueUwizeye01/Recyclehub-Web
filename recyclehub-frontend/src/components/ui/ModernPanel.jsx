/**
 * Content panel for dashboard pages.
 */
export default function ModernPanel({ title, subtitle, children, className = '', headerRight = null }) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`.trim()}
    >
      {(title || subtitle || headerRight) && (
        <div className="flex flex-col gap-1 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? <h2 className="text-sm font-semibold text-gray-900">{title}</h2> : null}
            {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
          </div>
          {headerRight}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
