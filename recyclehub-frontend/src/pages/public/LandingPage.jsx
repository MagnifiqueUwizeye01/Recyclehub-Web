import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import MaterialCard from '../../components/features/MaterialCard';
import MaterialFilters from '../../components/features/MaterialFilters';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import { getMaterials } from '../../api/materials.api';
import { normalizeMaterial } from '../../utils/materialMapper';
import { useAuth } from '../../hooks/useAuth';

export default function LandingPage() {
  const { refreshSession } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, pageSize: 12, status: 'Available' });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const type = searchParams.get('type');
    const search = searchParams.get('search') || '';
    setFilters((prev) => ({
      ...prev,
      page: 1,
      types: type ? [type] : undefined,
      search: search || undefined,
    }));
  }, [searchParams]);

  const handleFiltersChange = useCallback(
    (next) => {
      setFilters(next);
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next.search) sp.set('search', next.search);
          else sp.delete('search');
          if (next.types?.length === 1) sp.set('type', next.types[0]);
          else sp.delete('type');
          return sp;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMaterials(filters);
      const data = res.data;
      const raw = data?.data ?? data ?? [];
      const arr = Array.isArray(raw) ? raw : [];
      setMaterials(arr.map((m) => normalizeMaterial(m)).filter(Boolean));
      setTotalPages(data?.totalPages ?? 1);
      setTotalCount(data?.totalCount ?? arr.length);
    } catch {
      setMaterials([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    refreshSession?.();
  }, [refreshSession]);

  const resetFilters = () =>
    handleFiltersChange({
      page: 1,
      pageSize: 12,
      status: 'Available',
      search: undefined,
      types: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      city: undefined,
      smartSwapOnly: false,
      sortBy: 'newest',
    });

  return (
    <div className="min-h-full">
      <section className="landing-hero" aria-label="RecycleHub">
        <img
          src="/images/recycle-hero.jpg"
          alt=""
          className="landing-hero__img"
          fetchPriority="high"
        />
        <div className="landing-hero__overlay" aria-hidden />
        <div className="relative z-10 px-4 text-center">
          <p className="text-base font-medium tracking-wide text-white md:text-lg">
            Buy and sell recycled materials in Rwanda.
          </p>
        </div>
      </section>

      <section id="listings" className="landing-listings pb-12 pt-5">
        <div className="page-container">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-stone-800">Listings</h2>
            {!loading && totalCount > 0 && (
              <span className="text-xs text-stone-500">{totalCount} available</span>
            )}
          </div>

          <div className="mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white py-2 text-sm text-stone-700"
            >
              <SlidersHorizontal size={16} aria-hidden />
              Filters
            </button>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-[5rem] rounded-lg border border-stone-300/80 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Filter</h3>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs text-stone-500 hover:text-stone-800"
                  >
                    Reset
                  </button>
                </div>
                <MaterialFilters
                  filters={filters}
                  onChange={handleFiltersChange}
                  exclusiveMaterialType
                />
              </div>
            </aside>

            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <button
                  type="button"
                  className="absolute inset-0 bg-stone-900/40"
                  aria-label="Close filters"
                  onClick={() => setMobileFiltersOpen(false)}
                />
                <div className="absolute right-0 top-0 h-full w-full max-w-xs bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
                    <span className="text-sm font-medium text-stone-900">Filters</span>
                    <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-4">
                    <MaterialFilters
                      filters={filters}
                      onChange={(next) => {
                        handleFiltersChange(next);
                        setMobileFiltersOpen(false);
                      }}
                      exclusiveMaterialType
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="min-w-0 flex-1">
              {loading ? (
                <div className="flex justify-center rounded-lg border border-stone-200 bg-white py-16">
                  <Spinner size="lg" />
                </div>
              ) : materials.length === 0 ? (
                <div className="rounded-lg border border-stone-200 bg-white px-4 py-12 text-center text-sm text-stone-600">
                  No listings match your filters.
                </div>
              ) : (
                <>
                  <div className="mb-3 flex justify-end">
                    <select
                      value={filters.sortBy || 'newest'}
                      onChange={(e) => handleFiltersChange({ ...filters, sortBy: e.target.value })}
                      className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-700"
                      aria-label="Sort listings"
                    >
                      <option value="newest">Newest</option>
                      <option value="price_asc">Price ↑</option>
                      <option value="price_desc">Price ↓</option>
                      <option value="popular">Popular</option>
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {materials.map((m) => (
                      <MaterialCard key={m.id} material={m} linkPrefix="/m" compact />
                    ))}
                  </div>

                  <Pagination
                    page={filters.page}
                    totalPages={totalPages}
                    onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
                    className="mt-8"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
