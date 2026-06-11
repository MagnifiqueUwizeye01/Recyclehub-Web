/** Compact inline metrics — one row, no oversized cards. */
export default function AdminStatStrip({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap overflow-hidden rounded-lg border border-gray-200 bg-white">
      {items.map(({ label, value, hint }, i) => (
        <div
          key={label}
          className={`min-w-[6.5rem] flex-1 px-4 py-2.5 ${i > 0 ? 'border-l border-gray-100' : ''}`}
        >
          <p className="text-base font-semibold tabular-nums text-gray-900">{value}</p>
          <p className="text-[11px] text-gray-500">{label}</p>
          {hint ? <p className="mt-0.5 text-[10px] text-gray-400">{hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
