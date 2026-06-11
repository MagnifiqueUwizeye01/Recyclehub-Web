/**
 * Reason / category breakdown as weighted tags — not progress bars.
 */
export default function WeightedTags({
  data = [],
  nameKey = 'name',
  valueKey = 'count',
  total,
}) {
  const rows = (Array.isArray(data) ? data : []).filter((d) => Number(d[valueKey]) > 0);
  if (!rows.length) return <p className="text-xs text-gray-500">No data yet.</p>;

  const max = Math.max(...rows.map((d) => Number(d[valueKey])));
  const denom = total ?? rows.reduce((s, d) => s + Number(d[valueKey]), 0);

  return (
    <div className="flex flex-wrap gap-2">
      {rows.map((row) => {
        const label = row[nameKey] ?? '—';
        const n = Number(row[valueKey]);
        const weight = 0.72 + (n / max) * 0.28;
        const pct = denom > 0 ? Math.round((n / denom) * 100) : 0;

        return (
          <span
            key={String(label)}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-gray-800"
            style={{ fontSize: `${(0.68 + weight * 0.22).toFixed(2)}rem` }}
            title={`${label}: ${n} (${pct}%)`}
          >
            <span className="font-medium">{label}</span>
            <span className="text-[10px] tabular-nums text-gray-400">{n}</span>
          </span>
        );
      })}
    </div>
  );
}
