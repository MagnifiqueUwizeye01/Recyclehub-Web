import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Sparkles } from 'lucide-react';
import MaterialCard from '../../components/features/MaterialCard';
import MaterialFilters from '../../components/features/MaterialFilters';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import { getMaterials } from '../../api/materials.api';
import { normalizeMaterial } from '../../utils/materialMapper';

export default function LandingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, pageSize: 12, status: 'Available' });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950/[0.03] via-white to-hub-section">
      <header className="relative border-b border-emerald-100/80 bg-white/90 backdrop-blur-sm">
        <div className="page-container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
                <ShieldCheck size={14} className="text-emerald-600" aria-hidden />
                Verified B2B · Rwanda
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-hub-text sm:text-4xl md:text-[2.35rem] md:leading-tight">
                Industrial materials, priced clearly
              </h1>
              <p className="mt-3 text-base text-hub-muted leading-relaxed max-w-xl">
                Browse live listings from verified sellers.{' '}
                <span className="text-hub-text font-medium">Sign in when you&apos;re ready to order</span> — no account
                needed to explore.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border-2 border-hub-border bg-white px-5 py-2.5 text-sm font-semibold text-hub-text hover:border-emerald-400 hover:text-emerald-800 transition-colors"
              >
                Sign in to buy
              </Link>
              <Link
                to="/register"
                state={{ preselectedRole: 'Buyer' }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/15 hover:bg-emerald-700 transition-colors"
              >
                <Sparkles size={16} className="opacity-90" aria-hidden />
                Register as buyer
              </Link>
              <Link
                to="/register"
                state={{ preselectedRole: 'Seller' }}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 underline-offset-2 hover:underline"
              >
                List materials →
              </Link>
            </div>
          </div>
          {totalCount > 0 && (
            <p className="mt-6 text-sm text-hub-muted">
              <span className="font-semibold text-hub-text">{totalCount.toLocaleString()}</span> listings match your
              filters
            </p>
          )}
        </div>
      </header>

      <div className="page-container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <aside className="lg:w-72 shrink-0 order-2 lg:order-1">
            <div className="lg:sticky lg:top-28 rounded-2xl border border-hub-border bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-hub-text mb-1">Refine results</h2>
              <p className="text-xs text-hub-muted mb-4">Type, price, city, SmartSwap</p>
              <MaterialFilters
                filters={filters}
                onChange={handleFiltersChange}
                exclusiveMaterialType
              />
            </div>
          </aside>

          <div className="flex-1 min-w-0 order-1 lg:order-2">
            {loading ? (
              <div className="flex justify-center py-24 rounded-2xl border border-hub-border bg-white">
                <Spinner size="lg" />
              </div>
            ) : materials.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-16 text-center">
                <p className="text-hub-text font-medium">No listings match these filters.</p>
                <p className="mt-2 text-sm text-hub-muted">Try adjusting filters or clear the search.</p>
                <button
                  type="button"
                  onClick={() =>
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
                    })
                  }
                  className="mt-6 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {materials.map((m) => (
                    <MaterialCard key={m.id} material={m} linkPrefix="/m" />
                  ))}
                </div>
                <Pagination
                  page={filters.page}
                  totalPages={totalPages}
                  onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
                  className="mt-10"
                />
              </>
            )}
          </div>
        </div>
      </div>

      <section className="border-t border-hub-border bg-white py-10">
        <div className="page-container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm text-hub-muted max-w-lg">
            Payments with MTN MoMo after checkout. Sellers are verified before they can list.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/register" className="text-sm font-semibold text-emerald-700 hover:underline">
              Join as buyer
            </Link>
            <span className="text-hub-muted hidden sm:inline">·</span>
            <Link to="/login" className="text-sm font-semibold text-hub-muted hover:text-hub-text">
              Already have an account?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
