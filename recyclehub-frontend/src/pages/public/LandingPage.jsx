import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Search,
  Layers,
  TrendingUp,
  Truck,
  Clock,
  Star,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
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

  // Features data
  const features = [
    { icon: ShieldCheck, title: "Verified Sellers", description: "All sellers undergo rigorous verification before listing" },
    { icon: TrendingUp, title: "Market Prices", description: "Transparent pricing based on real-time market data" },
    { icon: Truck, title: "Logistics Support", description: "End-to-end delivery coordination across Rwanda" },
    { icon: Clock, title: "Quick Turnaround", description: "Average order fulfillment in 48 hours" },
  ];

  // Categories data
  const categories = [
    { name: "Construction Materials", count: 124, icon: Layers },
    { name: "Industrial Equipment", count: 87, icon: TrendingUp },
    { name: "Raw Materials", count: 56, icon: ShieldCheck },
    { name: "Packaging Supplies", count: 43, icon: Truck },
  ];

  return (
    <div className="bg-gradient-to-b from-emerald-50/30 via-white to-gray-50">
      {/* Hero — site chrome (nav + footer) comes from PublicLayout */}
      <header className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-700 text-xs font-semibold">
                <ShieldCheck size={14} />
                Rwanda's Leading B2B Marketplace
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Industrial Materials,
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"> Priced Clearly</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                Browse verified listings from trusted sellers across Rwanda. 
                Sign in when you're ready to order — explore freely without an account.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl">
                  Start Buying <ArrowRight size={18} />
                </Link>
                <Link
                  to="/register"
                  state={{ preselectedRole: 'Seller' }}
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-emerald-300 hover:text-emerald-600 transition-all"
                >
                  Start selling
                </Link>
              </div>

              {totalCount > 0 && (
                <div className="flex items-center gap-4 pt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-gray-500">{totalCount.toLocaleString()} active listings</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300" />
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-gray-500">4.9/5 from 2k+ reviews</span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative hidden lg:block">
              <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="absolute -top-3 -right-3 w-20 h-20 bg-emerald-100 rounded-full blur-2xl" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <TrendingUp size={16} className="text-emerald-600" />
                    </div>
                    <span>Market trends • Updated hourly</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Steel (per ton)", price: "₦850,000", change: "+2.4%" },
                      { label: "Cement (50kg)", price: "₦4,200", change: "-0.8%" },
                      { label: "Copper (kg)", price: "₦7,500", change: "+1.2%" },
                      { label: "Aluminum (kg)", price: "₦3,200", change: "+0.5%" },
                    ].map((item, i) => (
                      <div key={i} className="p-3 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="text-lg font-bold text-gray-900">{item.price}</p>
                        <p className={`text-xs ${item.change.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
                          {item.change}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-12 max-w-3xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for materials, suppliers, or categories..."
                className="w-full pl-12 pr-24 py-4 rounded-2xl border border-gray-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900"
                value={filters.search || ''}
                onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value, page: 1 })}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why choose RecycleHub?</h2>
            <p className="text-gray-500 mt-2">Trusted by thousands of businesses across Rwanda</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                  <feature.icon size={24} className="text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
              <p className="text-gray-500 mt-1">Find exactly what you need</p>
            </div>
            <Link to="/" className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1">
              View all categories
              <ChevronRight size={16} className="shrink-0 opacity-70" aria-hidden />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <Link
                key={i}
                to={`/?type=${encodeURIComponent(cat.name)}`}
                className="group bg-white rounded-xl p-5 hover:shadow-md transition-all border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <cat.icon size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-400">{cat.count} listings</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area with Filters */}
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        {/* Mobile filter button */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl shadow-sm"
          >
            <SlidersHorizontal size={18} />
            Filter Results
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={() => handleFiltersChange({
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
                  })}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Reset all
                </button>
              </div>
              <MaterialFilters
                filters={filters}
                onChange={handleFiltersChange}
                exclusiveMaterialType
              />
            </div>
          </aside>

          {/* Mobile Filters Modal */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="font-semibold">Filters</h2>
                  <button onClick={() => setMobileFiltersOpen(false)} className="p-1">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
                  <MaterialFilters
                    filters={filters}
                    onChange={(newFilters) => {
                      handleFiltersChange(newFilters);
                      setMobileFiltersOpen(false);
                    }}
                    exclusiveMaterialType
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Area */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center py-24 bg-white rounded-2xl border border-gray-100">
                <Spinner size="lg" />
              </div>
            ) : materials.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
                <button
                  onClick={() => handleFiltersChange({
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
                  })}
                  className="inline-flex px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{materials.length}</span> of{" "}
                    <span className="font-medium text-gray-900">{totalCount}</span> results
                  </p>
                  <select
                    value={filters.sortBy || 'newest'}
                    onChange={(e) => handleFiltersChange({ ...filters, sortBy: e.target.value })}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="newest">Newest first</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
    </div>
  );
}