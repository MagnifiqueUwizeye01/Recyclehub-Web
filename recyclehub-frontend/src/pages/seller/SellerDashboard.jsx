import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, TrendingUp, Plus, RefreshCw, Clock } from 'lucide-react';
import SellerLayout from '../../layouts/SellerLayout';
import ErrorState from '../../components/ui/ErrorState';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import DashboardStatCard from '../../components/ui/DashboardStatCard';
import ModernPanel from '../../components/ui/ModernPanel';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import { getSellerMaterials } from '../../api/materials.api';
import { getSellerOrders, applySellerOrderAction } from '../../api/orders.api';
import { formatRWF } from '../../utils/formatCurrency';
import { getPagedItems } from '../../utils/pagedResponse';
import { normalizeMaterial } from '../../utils/materialMapper';
import { normalizeOrderRow } from '../../utils/orderMapper';
import toast from 'react-hot-toast';

export default function SellerDashboard() {
  const [materials, setMaterials] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [materialsTotalCount, setMaterialsTotalCount] = useState(0);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [materialsRes, ordersRes, pendingRes] = await Promise.all([
        getSellerMaterials({ pageNumber: 1, pageSize: 500 }),
        getSellerOrders({ pageNumber: 1, pageSize: 500 }),
        getSellerOrders({ status: 'Pending', pageNumber: 1, pageSize: 20 }),
      ]);
      const mat = getPagedItems(materialsRes);
      setMaterials(mat.items.map((m) => normalizeMaterial(m)).filter(Boolean));
      setMaterialsTotalCount(mat.totalCount);

      const ord = getPagedItems(ordersRes);
      setOrders(ord.items.map(normalizeOrderRow));
      setOrdersTotalCount(ord.totalCount);

      const pend = getPagedItems(pendingRes);
      setPendingOrders(pend.items.map(normalizeOrderRow));
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
    const delivered = orders.filter((order) => order.status === 'Delivered');
    const liveStatuses = ['Available', 'Verified'];
    return {
      totalListings: materialsTotalCount,
      activeListings: materials.filter((item) => liveStatuses.includes(item.status)).length,
      totalOrders: ordersTotalCount,
      revenue: delivered.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    };
  }, [materials, materialsTotalCount, orders, ordersTotalCount]);

  const handleOrderAction = async (orderId, status) => {
    try {
      await applySellerOrderAction(orderId, status);
      toast.success(`Order ${status.toLowerCase()}.`);
      load();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Could not update order.');
    }
  };

  return (
    <SellerLayout>
      <div className="w-full space-y-8">
        <ModernPageHeader
          title="Seller dashboard"
          description="Overview of your listings, orders, and revenue."
          actions={
            <>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-emerald-200 hover:bg-gray-50"
              >
                <RefreshCw size={16} className="text-gray-400" />
                Refresh
              </button>
              <Link
                to="/seller/materials/add"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <Plus size={18} />
                Add listing
              </Link>
            </>
          }
        />

        {loading && <PageLoadingCard message="Loading your dashboard…" />}
        {!loading && error && <ErrorState title="Unable to load dashboard" message={error} onRetry={load} />}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardStatCard
                icon={Package}
                label="Total listings"
                value={stats.totalListings.toLocaleString()}
                badge="Catalog"
                tone="emerald"
              />
              <DashboardStatCard
                icon={TrendingUp}
                label="Active listings"
                value={stats.activeListings.toLocaleString()}
                badge="Live"
                tone="cyan"
              />
              <DashboardStatCard
                icon={ShoppingCart}
                label="Total orders"
                value={stats.totalOrders.toLocaleString()}
                badge="All time"
                tone="blue"
              />
              <DashboardStatCard
                icon={TrendingUp}
                label="Revenue (delivered)"
                value={formatRWF(stats.revenue)}
                badge="Settled"
                tone="violet"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ModernPanel
                title="Pending orders"
                subtitle="Accept or reject new buyer requests."
                headerRight={
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                    <Clock size={14} />
                    {pendingOrders.length} open
                  </span>
                }
              >
                {pendingOrders.length === 0 ? (
                  <p className="text-sm text-gray-500">No pending orders right now.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:bg-white"
                      >
                        <p className="font-medium text-gray-900">{order.materialTitle || 'Material order'}</p>
                        <p className="mt-1 text-sm text-gray-600">{formatRWF(order.totalAmount || 0)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleOrderAction(order.id, 'Accepted')}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOrderAction(order.id, 'Rejected')}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ModernPanel>

              <ModernPanel title="Recent listings" subtitle="Latest materials on your storefront.">
                {materials.length === 0 ? (
                  <p className="text-sm text-gray-500">No listings yet. Add your first listing to get started.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                    {materials.slice(0, 5).map((material) => (
                      <li
                        key={material.id}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-gray-50/80"
                      >
                        <span className="font-medium text-gray-900">{material.title || 'Untitled'}</span>
                        <span className="shrink-0 font-medium text-emerald-700">{formatRWF(material.unitPrice || 0)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </ModernPanel>
            </div>
          </>
        )}
      </div>
    </SellerLayout>
  );
}
