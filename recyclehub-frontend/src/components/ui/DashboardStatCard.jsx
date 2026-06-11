/**
 * Compact metric tile for dashboards.
 */
export default function DashboardStatCard({
  icon: Icon,
  label,
  value,
  hint,
  badge,
  tone = 'emerald',
}) {
  const iconTone = {
    emerald: 'bg-emerald-50 text-emerald-700',
    violet: 'bg-violet-50 text-violet-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    cyan: 'bg-cyan-50 text-cyan-700',
  }[tone] || 'bg-emerald-50 text-emerald-700';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        {Icon ? (
          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${iconTone}`}>
            <Icon size={16} strokeWidth={2} />
          </div>
        ) : (
          <span />
        )}
        {badge ? (
          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="text-lg font-semibold tabular-nums text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
      {hint ? <p className="mt-2 text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  );
}
