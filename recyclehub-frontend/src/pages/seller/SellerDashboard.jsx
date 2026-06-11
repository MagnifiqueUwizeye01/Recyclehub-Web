import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Clock } from 'lucide-react';
import SellerLayout from '../../layouts/SellerLayout';
import ErrorState from '../../components/ui/ErrorState';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import ModernPanel from '../../components/ui/ModernPanel';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import AdminStatStrip from '../../components/admin/AdminStatStrip';
import AdminRefreshButton from '../../components/admin/AdminRefreshButton';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
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
      <div className="w-full space-y-4">
        <ModernPageHeader
          title="Seller dashboard"
          description="Overview of your listings, orders, and revenue."
          actions={
            <>
              <AdminRefreshButton onClick={load} />
              <Link
                to="/seller/materials/add"
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                <Plus size={14} />
                Add listing
              </Link>
            </>
          }
        />

        {loading && <PageLoadingCard message="Loading your dashboard…" />}
        {!loading && error && <ErrorState title="Unable to load dashboard" message={error} onRetry={load} />}

        {!loading && !error && (
          <>
            <AdminStatStrip
              items={[
                { label: 'Total listings', value: stats.totalListings.toLocaleString() },
                { label: 'Active listings', value: stats.activeListings.toLocaleString() },
                { label: 'Total orders', value: stats.totalOrders.toLocaleString() },
                { label: 'Revenue (delivered)', value: formatRWF(stats.revenue) },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ModernPanel
                title="Pending orders"
                subtitle="Accept or reject new buyer requests."
                headerRight={
                  pendingOrders.length > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      <Clock size={12} />
                      {pendingOrders.length} open
                    </span>
                  ) : null
                }
              >
                {pendingOrders.length === 0 ? (
                  <p className="text-xs text-gray-500">No pending orders right now.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-md border border-gray-100">
                    {pendingOrders.map((order) => (
                      <li
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 hover:bg-gray-50/70"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {order.materialTitle || 'Material order'}
                          </p>
                          <p className="text-xs tabular-nums text-gray-500">{formatRWF(order.totalAmount || 0)}</p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOrderAction(order.id, 'Accepted')}
                            className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOrderAction(order.id, 'Rejected')}
                            className="rounded border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Reject
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </ModernPanel>

              <ModernPanel title="Recent listings" subtitle="Latest materials on your storefront.">
                {materials.length === 0 ? (
                  <AdminEmptyState
                    title="No listings yet"
                    description={
                      <>
                        <Link to="/seller/materials/add" className="font-medium text-emerald-700 hover:underline">
                          Add your first listing
                        </Link>{' '}
                        to get started.
                      </>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-md border border-gray-100">
                    {materials.slice(0, 5).map((material) => (
                      <li
                        key={material.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-gray-50/70"
                      >
                        <span className="truncate font-medium text-gray-900">{material.title || 'Untitled'}</span>
                        <span className="shrink-0 text-xs tabular-nums font-medium text-emerald-700">
                          {formatRWF(material.unitPrice || 0)}
                        </span>
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
