import { useCallback, useEffect, useMemo, useState } from 'react';
import SellerLayout from '../../layouts/SellerLayout';
import ErrorState from '../../components/ui/ErrorState';
import { getSellerOrders } from '../../api/orders.api';
import { getSellerMaterials } from '../../api/materials.api';
import { formatRWF } from '../../utils/formatCurrency';
import { getPagedItems } from '../../utils/pagedResponse';
import { normalizeMaterial } from '../../utils/materialMapper';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          {!loading && !error && (
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
          )}
        </div>
        {loading && <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">Loading analytics...</div>}
        {!loading && error && <ErrorState title="Unable to Load Analytics" message={error} onRetry={load} />}
        {!loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Total Listings" value={materialsTotalCount} />
              <Metric
                label="Active Listings"
                value={materials.filter((m) => ['Available', 'Verified'].includes(m.status)).length}
              />
              <Metric label="Delivered Orders" value={delivered.length} />
              <Metric label="Revenue" value={formatRWF(revenue)} />
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Orders by status</h2>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByStatus} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </SellerLayout>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
