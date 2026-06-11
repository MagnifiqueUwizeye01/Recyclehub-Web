/** Underline tabs — minimal, not pill-shaped. */
export default function AdminSegmentTabs({ tabs = [], active, onChange }) {
  return (
    <div className="flex flex-wrap gap-x-1 border-b border-gray-200">
      {tabs.map(({ value, label, count }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
            active === value
              ? 'border-emerald-600 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
          {count != null ? (
            <span className="ml-1.5 tabular-nums text-gray-400">{count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
