import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, CheckCircle, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import BuyerLayout from '../../layouts/BuyerLayout';
import ErrorState from '../../components/ui/ErrorState';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import DashboardStatCard from '../../components/ui/DashboardStatCard';
import ModernPanel from '../../components/ui/ModernPanel';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import { getBuyerOrders } from '../../api/orders.api';
import { getPagedItems } from '../../utils/pagedResponse';
import { normalizeOrderRow } from '../../utils/orderMapper';
import { formatRWF } from '../../utils/formatCurrency';

function isActiveOrderStatus(status) {
  return ['AwaitingPayment', 'Pending', 'Accepted', 'Paid', 'Shipped'].includes(status);
}

function statusBadgeClass(status) {
  const colors = {
    Delivered: 'bg-emerald-50 text-emerald-800',
    Shipped: 'bg-blue-50 text-blue-800',
    Paid: 'bg-violet-50 text-violet-800',
    Accepted: 'bg-amber-50 text-amber-800',
    Pending: 'bg-orange-50 text-orange-800',
    AwaitingPayment: 'bg-red-50 text-red-800',
    Cancelled: 'bg-gray-100 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
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
      setOrders(items.map((o) => normalizeOrderRow(o)).filter(Boolean));
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
    const active = orders.filter((o) => isActiveOrderStatus(o.status));
    const totalSpent = delivered.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    return {
      totalOrders: ordersTotalCount,
      activeOrders: active.length,
      completedOrders: delivered.length,
      amountSpent: totalSpent,
      pendingPayment: orders.filter((o) => o.status === 'AwaitingPayment').length,
    };
  }, [orders, ordersTotalCount]);

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5),
    [orders]
  );

  return (
    <BuyerLayout>
      <div className="w-full space-y-6">
        <ModernPageHeader
          title="Buyer dashboard"
          description="Your orders and spending at a glance."
          actions={
            <>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw size={15} className="text-gray-400" />
                Refresh
              </button>
              <Link
                to="/buyer/marketplace"
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Browse marketplace
              </Link>
            </>
          }
        />

        {loading && <PageLoadingCard message="Loading your dashboard…" />}
        {!loading && error && <ErrorState title="Unable to load dashboard" message={error} onRetry={load} />}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardStatCard
                icon={ShoppingBag}
                label="Total orders"
                value={stats.totalOrders.toLocaleString()}
                badge="All time"
                tone="emerald"
              />
              <DashboardStatCard
                icon={Package}
                label="Active orders"
                value={stats.activeOrders.toLocaleString()}
                badge="In progress"
                tone="blue"
              />
              <DashboardStatCard
                icon={CheckCircle}
                label="Completed"
                value={stats.completedOrders.toLocaleString()}
                badge="Delivered"
                tone="cyan"
              />
              <DashboardStatCard
                icon={TrendingUp}
                label="Total spent"
                value={formatRWF(stats.amountSpent)}
                badge="Settled"
                tone="violet"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ModernPanel
                title="Recent orders"
                subtitle="Latest purchases and their status."
                headerRight={
                  stats.pendingPayment > 0 ? (
                    <Link
                      to="/buyer/orders"
                      className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                    >
                      <Clock size={13} />
                      {stats.pendingPayment} awaiting payment
                    </Link>
                  ) : (
                    <Link to="/buyer/orders" className="text-xs font-medium text-emerald-700 hover:text-emerald-800">
                      View all
                    </Link>
                  )
                }
              >
                {recentOrders.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No orders yet.{' '}
                    <Link to="/buyer/marketplace" className="font-medium text-emerald-700 hover:underline">
                      Browse materials
                    </Link>
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-md border border-gray-100">
                    {recentOrders.map((order) => (
                      <li
                        key={order.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-gray-50/80"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            {order.materialTitle || 'Material order'}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : 'Recent'}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-medium text-gray-900">{formatRWF(order.totalAmount || 0)}</p>
                          <span
                            className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeClass(order.status)}`}
                          >
                            {order.status || 'Pending'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ModernPanel>

              <ModernPanel title="Quick links" subtitle="Common buyer actions.">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Link
                    to="/buyer/marketplace"
                    className="rounded-md border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-800 hover:border-emerald-200 hover:bg-emerald-50/50"
                  >
                    Marketplace
                  </Link>
                  <Link
                    to="/buyer/orders"
                    className="rounded-md border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-800 hover:border-emerald-200 hover:bg-emerald-50/50"
                  >
                    My orders
                  </Link>
                  <Link
                    to="/messages"
                    className="rounded-md border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-800 hover:border-emerald-200 hover:bg-emerald-50/50"
                  >
                    Messages
                  </Link>
                  <Link
                    to="/profile"
                    className="rounded-md border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-800 hover:border-emerald-200 hover:bg-emerald-50/50"
                  >
                    Profile
                  </Link>
                </div>
              </ModernPanel>
            </div>
          </>
        )}
      </div>
    </BuyerLayout>
  );
}
