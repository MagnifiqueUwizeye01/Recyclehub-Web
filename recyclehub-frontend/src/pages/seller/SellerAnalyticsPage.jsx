import { useCallback, useEffect, useMemo, useState } from 'react';
import { Package, TrendingUp, ShoppingCart, Wallet } from 'lucide-react';
import SellerLayout from '../../layouts/SellerLayout';
import ErrorState from '../../components/ui/ErrorState';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import DashboardStatCard from '../../components/ui/DashboardStatCard';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import { getSellerOrders } from '../../api/orders.api';
import { getSellerMaterials } from '../../api/materials.api';
import { formatRWF } from '../../utils/formatCurrency';
import { getPagedItems } from '../../utils/pagedResponse';
import { normalizeMaterial } from '../../utils/materialMapper';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import SimpleBarChart from '../../components/ui/SimpleBarChart';

export default function SellerAnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [materialsTotalCount, setMaterialsTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, materialsRes] = await Promise.all([
        getSellerOrders({ pageNumber: 1, pageSize: 500 }),
        getSellerMaterials({ pageNumber: 1, pageSize: 500 }),
      ]);
      const ord = getPagedItems(ordersRes);
      setOrders(ord.items.map((o) => ({ ...o, id: o.orderId ?? o.id })));
      const mat = getPagedItems(materialsRes);
      setMaterials(mat.items.map((m) => normalizeMaterial(m)).filter(Boolean));
      setMaterialsTotalCount(mat.totalCount);
    } catch (err) {
      console.error(err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const delivered = orders.filter((order) => order.status === 'Delivered');
  const revenue = delivered.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  const ordersByStatus = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const s = o.status ?? 'Unknown';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  const runExport = (kind) => {
    const cols = [
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
    ];
    const rows = [
      { metric: 'Total listings (reported)', value: String(materialsTotalCount) },
      { metric: 'Delivered orders', value: String(delivered.length) },
      { metric: 'Revenue (delivered)', value: formatRWF(revenue) },
      ...ordersByStatus.map((r) => ({ metric: `Orders — ${r.name}`, value: String(r.count) })),
    ];
    if (kind === 'pdf') exportToPDF('Seller analytics', cols, rows, 'seller-analytics');
    else exportToExcel('Seller analytics', cols, rows, 'seller-analytics');
  };

  const activeListings = materials.filter((m) => ['Available', 'Verified'].includes(m.status)).length;

  return (
    <SellerLayout>
      <div className="w-full space-y-8">
        <ModernPageHeader
          title="Analytics"
          description="Listings, fulfillment, and revenue from your seller account."
          actions={
            !loading && !error ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runExport('pdf')}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => runExport('excel')}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                >
                  Export Excel
                </button>
              </div>
            ) : null
          }
        />
        {loading && <PageLoadingCard message="Loading analytics…" />}
        {!loading && error && <ErrorState title="Unable to load analytics" message={error} onRetry={load} />}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardStatCard
                icon={Package}
                label="Total listings"
                value={String(materialsTotalCount)}
                badge="Catalog"
                tone="emerald"
              />
              <DashboardStatCard
                icon={TrendingUp}
                label="Active listings"
                value={String(activeListings)}
                badge="Live"
                tone="cyan"
              />
              <DashboardStatCard
                icon={ShoppingCart}
                label="Delivered orders"
                value={String(delivered.length)}
                badge="Completed"
                tone="blue"
              />
              <DashboardStatCard
                icon={Wallet}
                label="Revenue (delivered)"
                value={formatRWF(revenue)}
                badge="RWF"
                tone="violet"
              />
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Orders by status</h2>
              <SimpleBarChart data={ordersByStatus} dataKey="count" nameKey="name" />
            </div>
          </>
        )}
      </div>
    </SellerLayout>
  );
}
