/**
 * Proportional tile mosaic — no bar charts.
 * Each segment gets a grid span proportional to its share of the total.
 */
const DEFAULT_PALETTE = [
  '#047857',
  '#0f766e',
  '#0369a1',
  '#6d28d9',
  '#b45309',
  '#b91c1c',
  '#475569',
  '#0891b2',
];

function colorFor(label, index, colorMap) {
  if (colorMap?.[label]) return colorMap[label];
  return DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
}

export default function DistributionMosaic({
  data = [],
  nameKey = 'name',
  valueKey = 'count',
  colorMap,
  emptyLabel = 'No data yet.',
}) {
  const rows = (Array.isArray(data) ? data : []).filter((d) => Number(d[valueKey]) > 0);
  const total = rows.reduce((sum, d) => sum + Number(d[valueKey]), 0);

  if (!rows.length) {
    return <p className="text-xs text-gray-500">{emptyLabel}</p>;
  }

  const spans = rows.map((row) => {
    const n = Number(row[valueKey]);
    return Math.max(2, Math.round((n / total) * 12));
  });
  const spanSum = spans.reduce((a, b) => a + b, 0);
  const normalized = spans.map((s) => Math.max(2, Math.round((s / spanSum) * 12)));

  return (
    <div className="grid grid-cols-12 gap-1.5 auto-rows-[minmax(3.25rem,auto)]">
      {rows.map((row, i) => {
        const label = row[nameKey] ?? '—';
        const n = Number(row[valueKey]);
        const pct = total > 0 ? Math.round((n / total) * 100) : 0;
        const hue = colorFor(label, i, colorMap);
        const span = Math.min(12, normalized[i]);

        return (
          <div
            key={String(label)}
            style={{
              gridColumn: `span ${span}`,
              backgroundColor: `${hue}12`,
              borderColor: `${hue}30`,
            }}
            className="flex min-h-[3.25rem] flex-col justify-between rounded-md border px-2.5 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className="truncate text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: hue }}
                title={label}
              >
                {label}
              </span>
              <span className="shrink-0 text-[10px] tabular-nums text-gray-400">{pct}%</span>
            </div>
            <span className="text-lg font-semibold tabular-nums leading-none text-gray-900">{n}</span>
          </div>
        );
      })}
    </div>
  );
}
