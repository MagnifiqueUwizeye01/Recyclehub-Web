/**
 * Primary content surface: white card with soft border (dashboard pages).
 */
export default function ModernPanel({ title, subtitle, children, className = '', headerRight = null }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`.trim()}
    >
      {(title || subtitle || headerRight) && (
        <div className="flex flex-col gap-2 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? <h2 className="text-lg font-semibold text-gray-900">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
          </div>
          {headerRight}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
