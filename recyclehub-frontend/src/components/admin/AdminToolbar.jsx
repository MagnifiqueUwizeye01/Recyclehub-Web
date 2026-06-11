import { Search } from 'lucide-react';

export default function AdminToolbar({
  search,
  onSearchChange,
  placeholder = 'Search…',
  children,
  trailing,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[12rem] flex-1">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-200 py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
        />
      </div>
      {children}
      {trailing ? <div className="ml-auto text-xs text-gray-400">{trailing}</div> : null}
    </div>
  );
}
