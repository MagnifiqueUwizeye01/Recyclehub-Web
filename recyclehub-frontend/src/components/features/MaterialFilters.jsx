import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, Trash2, ChevronRight } from 'lucide-react';
import { MATERIAL_TYPES } from '../../utils/constants';

export default function MaterialFilters({
  filters,
  onChange,
  className = '',
  /** When true, at most one material type is selected (matches public URL `type` query). */
  exclusiveMaterialType = false,
}) {
  const [search, setSearch] = useState(filters.search || '');
  const debouncedSearch = useDebounce(search, 400);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const update = (key, value) => onChange({ ...filters, [key]: value, page: 1 });

  useEffect(() => {
    setSearch(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    const f = filtersRef.current;
    if ((debouncedSearch || '') === (f.search || '')) return;
    onChange({ ...f, search: debouncedSearch || undefined, page: 1 });
  }, [debouncedSearch]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Search</label>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Material type</p>
        <div className="flex flex-col gap-1.5">
          {MATERIAL_TYPES.map((type) => {
            const isActive = filters.types?.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  if (exclusiveMaterialType) {
                    update('types', !isActive ? [type] : undefined);
                    return;
                  }
                  const types = filters.types || [];
                  update('types', !isActive ? [...types, type] : types.filter((t) => t !== type));
                }}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  isActive
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-transparent text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{type}</span>
                <ChevronRight
                  size={16}
                  className={`shrink-0 text-gray-400 ${isActive ? 'text-emerald-600' : ''}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
        <input
          type="checkbox"
          checked={!!filters.smartSwapOnly}
          onChange={(e) => update('smartSwapOnly', e.target.checked)}
          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        SmartSwap offers only
      </label>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Price range (RWF)</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={0}
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => update('minPrice', e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <input
            type="number"
            min={0}
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => update('maxPrice', e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">City</label>
        <input
          value={filters.city || ''}
          onChange={(e) => update('city', e.target.value)}
          placeholder="e.g. Kigali"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Sort by</label>
        <select
          value={filters.sortBy || 'newest'}
          onChange={(e) => update('sortBy', e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="views">Most viewed</option>
        </select>
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({
            page: 1,
            pageSize: filters.pageSize || 12,
            status: 'Available',
            search: undefined,
            types: undefined,
            minPrice: undefined,
            maxPrice: undefined,
            city: undefined,
            smartSwapOnly: false,
            sortBy: 'newest',
          })
        }
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <Trash2 size={14} />
        Reset filters
      </button>
    </div>
  );
}
