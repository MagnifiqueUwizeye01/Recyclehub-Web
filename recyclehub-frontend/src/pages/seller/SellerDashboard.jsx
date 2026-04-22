import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SellerLayout from '../../layouts/SellerLayout';
import ErrorState from '../../components/ui/ErrorState';
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Seller Dashboard</h1>
            <p className="text-sm text-gray-600">Overview of your listings, orders, and revenue.</p>
          </div>
          <Link to="/seller/materials/add" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
            Add Listing
          </Link>
        </div>

        {loading && <div className="rounded-2xl bg-white p-8 text-sm text-gray-600 shadow-sm">Loading dashboard...</div>}
        {!loading && error && <ErrorState title="Unable to Load Dashboard" message={error} onRetry={load} />}

        {!loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ['Total Listings', stats.totalListings],
                ['Active Listings', stats.activeListings],
                ['Total Orders', stats.totalOrders],
                ['Revenue', formatRWF(stats.revenue)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Pending Orders</h2>
                {pendingOrders.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-600">No pending orders right now.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {pendingOrders.map((order) => (
                      <div key={order.id} className="rounded-xl border border-gray-100 p-3">
                        <p className="font-medium text-gray-900">{order.materialTitle || 'Material order'}</p>
                        <p className="text-sm text-gray-600">{formatRWF(order.totalAmount || 0)}</p>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => handleOrderAction(order.id, 'Accepted')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white">
                            Accept
                          </button>
                          <button onClick={() => handleOrderAction(order.id, 'Rejected')} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Recent Listings</h2>
                {materials.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-600">No listings yet. Add your first listing to get started.</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {materials.slice(0, 5).map((material) => (
                      <div key={material.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                        <p className="text-sm font-medium text-gray-900">{material.title || 'Untitled'}</p>
                        <p className="text-sm text-emerald-700">{formatRWF(material.unitPrice || 0)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </SellerLayout>
  );
}
