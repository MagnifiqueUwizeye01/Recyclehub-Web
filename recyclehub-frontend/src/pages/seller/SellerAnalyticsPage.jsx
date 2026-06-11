import { useCallback, useEffect, useMemo, useState } from 'react';
import SellerLayout from '../../layouts/SellerLayout';
import ErrorState from '../../components/ui/ErrorState';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import ModernPanel from '../../components/ui/ModernPanel';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import AdminStatStrip from '../../components/admin/AdminStatStrip';
import DistributionMosaic from '../../components/admin/DistributionMosaic';
import { getSellerOrders } from '../../api/orders.api';
import { getSellerMaterials } from '../../api/materials.api';
import { formatRWF } from '../../utils/formatCurrency';
import { getPagedItems } from '../../utils/pagedResponse';
import { normalizeMaterial } from '../../utils/materialMapper';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const ORDER_COLORS = {
  Pending: '#d97706',
  Accepted: '#059669',
  Cancelled: '#64748b',
  Delivered: '#047857',
  Shipped: '#2563eb',
  Paid: '#6d28d9',
  Rejected: '#dc2626',
  AwaitingPayment: '#b45309',
};

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
  const activeListings = materials.filter((m) => ['Available', 'Verified'].includes(m.status)).length;

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
      { metric: 'Active listings', value: String(activeListings) },
      { metric: 'Delivered orders', value: String(delivered.length) },
      { metric: 'Revenue (delivered)', value: formatRWF(revenue) },
      ...ordersByStatus.map((r) => ({ metric: `Orders — ${r.name}`, value: String(r.count) })),
    ];
    if (kind === 'pdf') exportToPDF('Seller analytics', cols, rows, 'seller-analytics');
    else exportToExcel('Seller analytics', cols, rows, 'seller-analytics');
  };

  return (
    <SellerLayout>
      <div className="w-full space-y-4">
        <ModernPageHeader
          title="Analytics"
          description="Listings, fulfillment, and revenue from your seller account."
          actions={
            !loading && !error ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runExport('pdf')}
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => runExport('excel')}
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
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
            <AdminStatStrip
              items={[
                { label: 'Total listings', value: String(materialsTotalCount) },
                { label: 'Active listings', value: String(activeListings) },
                { label: 'Delivered orders', value: String(delivered.length) },
                { label: 'Revenue (delivered)', value: formatRWF(revenue), hint: 'Settled only' },
              ]}
            />

            <ModernPanel title="Orders by status" subtitle="Proportional tile view of your order pipeline">
              <DistributionMosaic data={ordersByStatus} colorMap={ORDER_COLORS} />
            </ModernPanel>
          </>
        )}
      </div>
    </SellerLayout>
  );
}
