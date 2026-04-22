import { useCallback, useEffect, useMemo, useState } from 'react';
import BuyerLayout from '../../layouts/BuyerLayout';
import ErrorState from '../../components/ui/ErrorState';
import { getBuyerOrders } from '../../api/orders.api';
import { getPagedItems } from '../../utils/pagedResponse';
import { normalizeOrderRow } from '../../utils/orderMapper';
import { formatRWF } from '../../utils/formatCurrency';

/** Order is "active" for the buyer until it is done or cancelled. */
function isActiveOrderStatus(status) {
  return ['AwaitingPayment', 'Pending', 'Accepted', 'Paid', 'Shipped'].includes(status);
}

export default function BuyerDashboard() {
  const [orders, setOrders] = useState([]);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getBuyerOrders({ pageNumber: 1, pageSize: 500 });
      const { items, totalCount } = getPagedItems(res);
      const rows = items.map((o) => normalizeOrderRow(o)).filter(Boolean);
      setOrders(rows);
      setOrdersTotalCount(totalCount);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === 'Delivered');
    return {
      totalOrders: ordersTotalCount,
      activeOrders: orders.filter((o) => isActiveOrderStatus(o.status)).length,
      completedOrders: delivered.length,
      amountSpent: delivered.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    };
  }, [orders, ordersTotalCount]);

  return (
    <BuyerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Buyer Dashboard</h1>
        {loading && <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">Loading dashboard...</div>}
        {!loading && error && <ErrorState title="Unable to Load Dashboard" message={error} onRetry={load} />}
        {!loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="Total Orders" value={stats.totalOrders} />
              <Metric label="Active Orders" value={stats.activeOrders} />
              <Metric label="Completed Orders" value={stats.completedOrders} />
              <Metric label="Amount Spent" value={formatRWF(stats.amountSpent)} />
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              {orders.length === 0 ? (
                <p className="mt-3 text-sm text-gray-600">No orders found yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {orders.slice(0, 6).map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                      <p className="text-sm font-medium text-gray-900">{order.materialTitle || 'Marketplace order'}</p>
                      <p className="text-sm text-gray-600">{order.status || 'Pending'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </BuyerLayout>
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
