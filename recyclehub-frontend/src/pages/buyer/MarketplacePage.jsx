import { useCallback, useEffect, useState } from 'react';
import BuyerLayout from '../../layouts/BuyerLayout';
import ErrorState from '../../components/ui/ErrorState';
import MaterialCard from '../../components/features/MaterialCard';
import MaterialFilters from '../../components/features/MaterialFilters';
import Pagination from '../../components/ui/Pagination';
import { getMaterials } from '../../api/materials.api';

export default function MarketplacePage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ page: 1, pageSize: 9, status: 'Available' });
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMaterials(filters);
      const data = res?.data || {};
      setMaterials(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError('Failed to load marketplace listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <BuyerLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto w-full">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Marketplace</h1>
          <p className="mt-1 text-sm text-gray-500">Browse listings from verified sellers across Rwanda.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <MaterialFilters filters={filters} onChange={setFilters} />
          </aside>
          <div className="min-w-0 space-y-6">
            {loading && (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-sm text-gray-600 text-center">
                Loading listings…
              </div>
            )}
            {!loading && error && (
              <ErrorState title="Unable to load marketplace" message={error} onRetry={load} />
            )}
            {!loading && !error && materials.length === 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-600">
                No listings match your filters. Try adjusting search or filters.
              </div>
            )}
            {!loading && !error && materials.length > 0 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {materials.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
                </div>
                <Pagination
                  page={filters.page}
                  totalPages={totalPages}
                  onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}
