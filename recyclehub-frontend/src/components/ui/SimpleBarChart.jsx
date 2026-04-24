/**
 * Plain horizontal bars — no chart library.
 * `data` is an array of objects with `name` and a numeric `dataKey` field (default `count`).
 */
export default function SimpleBarChart({
  data = [],
  dataKey = 'count',
  nameKey = 'name',
  barClassName = 'bg-emerald-600',
}) {
  const rows = Array.isArray(data) ? data : [];
  const max = Math.max(1, ...rows.map((d) => Number(d[dataKey]) || 0));

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">No data.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const label = row[nameKey] ?? '—';
        const n = Number(row[dataKey]) || 0;
        const pct = Math.round((n / max) * 100);
        return (
          <li key={String(label)} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 truncate text-gray-600" title={label}>
              {label}
            </span>
            <div className="h-7 min-w-0 flex-1 rounded bg-gray-100">
              <div
                className={`h-full min-w-[2px] rounded ${barClassName}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-medium tabular-nums text-gray-900">{n}</span>
          </li>
        );
      })}
    </ul>
  );
}
