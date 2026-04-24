const toneMap = {
  emerald: {
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    hover: 'hover:border-emerald-100',
    blob: 'bg-emerald-50',
  },
  violet: {
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-600',
    hover: 'hover:border-violet-100',
    blob: 'bg-violet-50',
  },
  blue: {
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    hover: 'hover:border-blue-100',
    blob: 'bg-blue-50',
  },
  amber: {
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    hover: 'hover:border-amber-100',
    blob: 'bg-amber-50',
  },
  cyan: {
    iconBg: 'bg-cyan-100',
    iconText: 'text-cyan-600',
    hover: 'hover:border-cyan-100',
    blob: 'bg-cyan-50',
  },
};

/**
 * Metric tile used across buyer / seller / admin dashboards.
 */
export default function DashboardStatCard({
  icon: Icon,
  label,
  value,
  hint,
  badge,
  tone = 'emerald',
}) {
  const t = toneMap[tone] || toneMap.emerald;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg ${t.hover}`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-0 transition-opacity group-hover:opacity-100 ${t.blob}`}
      />
      <div className="relative p-5">
        <div className="mb-3 flex items-center justify-between">
          {Icon ? (
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.iconBg}`}>
              <Icon size={20} className={t.iconText} />
            </div>
          ) : (
            <span />
          )}
          {badge ? (
            <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">{badge}</span>
          ) : null}
        </div>
        <p className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">{value}</p>
        <p className="mt-1 text-sm text-gray-500">{label}</p>
        {hint ? <div className="mt-3 text-xs text-gray-500">{hint}</div> : null}
      </div>
    </div>
  );
}
