import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import BuyerLayout from '../../layouts/BuyerLayout';
import OrderStatusTracker from '../../components/features/OrderStatusTracker';
import StatusChip from '../../components/ui/StatusChip';
import Spinner from '../../components/ui/Spinner';
import { getOrderById, cancelOrder } from '../../api/orders.api';
import { getMaterialById } from '../../api/materials.api';
import { unwrapApiPayload, getApiErrorMessage } from '../../utils/authMapper';
import { formatRWF } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import {
  CreditCard,
  MessageSquare,
  ArrowLeft,
  Package,
  MapPin,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { canCancelOrder, canPayOrder } from '../../utils/statusHelpers';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || id === 'undefined') {
      setLoading(false);
      setOrder(null);
      return;
    }
    getOrderById(id)
      .then((r) => {
        const o = unwrapApiPayload(r);
        if (!o) {
          setOrder(null);
          return;
        }
        setOrder({
          ...o,
          id: o.orderId ?? o.id,
          createdAt: o.createdAt ?? o.orderDate,
        });
      })
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const mid = order?.materialId;
    if (!mid) return;
    getMaterialById(mid)
      .then((r) => {
        const m = r.data;
        if (m?.primaryImageUrl) setThumbUrl(m.primaryImageUrl);
      })
      .catch(() => setThumbUrl(null));
  }, [order?.materialId]);

  const handleCancel = async () => {
    if (!id || id === 'undefined') return;
    try {
      await cancelOrder(id, 'Cancelled by buyer');
      toast.success('Order cancelled');
      navigate('/buyer/orders');
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Could not cancel order');
    }
  };

  if (loading) {
    return (
      <BuyerLayout>
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </BuyerLayout>
    );
  }

  if (!order) {
    return (
      <BuyerLayout>
        <div className="max-w-lg mx-auto text-center py-24 space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto">
            <Info size={32} />
          </div>
          <p className="text-sm text-gray-600">We couldn&apos;t load this order.</p>
          <Link to="/buyer/orders" className="text-emerald-600 font-medium hover:underline inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to my orders
          </Link>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="max-w-4xl mx-auto pb-12 space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-emerald-700 font-medium"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <span className="text-gray-300">|</span>
          <Link to="/buyer/orders" className="hover:text-emerald-600">
            My orders
          </Link>
          <span className="text-gray-300">/</span>
          <Link to="/buyer/marketplace" className="hover:text-emerald-600">
            Marketplace
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order</p>
            <h1 className="text-2xl font-semibold text-gray-900 mt-1">#{order.id}</h1>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              Placed {formatDate(order.createdAt)}
            </p>
          </div>
          <StatusChip status={order.status} />
        </div>

        {order.status === 'AwaitingPayment' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
            Payment required: complete MTN MoMo on the payment screen. The seller is notified only after your payment succeeds.
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-6">Order progress</h2>
          <OrderStatusTracker status={order.status} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Items</h2>
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package size={32} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="font-medium text-gray-900">{order.materialTitle}</p>
                  <p className="text-sm text-gray-600">
                    Seller: {order.sellerCompanyName || order.sellerCompany || '—'}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span>
                      <span className="text-gray-500">Quantity: </span>
                      <span className="font-medium text-gray-900">
                        {order.quantityOrdered} {order.unit}
                      </span>
                    </span>
                    <span>
                      <span className="text-gray-500">Unit price: </span>
                      <span className="font-medium text-gray-900">{formatRWF(order.offeredUnitPrice)}</span>
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-emerald-700 pt-2">
                    Total {formatRWF(order.totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <MapPin size={16} className="text-emerald-600" />
                Shipping address
              </div>
              <p className="text-sm text-gray-700">{order.shippingAddress || '—'}</p>
            </div>

            {(order.buyerNote || order.sellerNote) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {order.buyerNote && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-4 text-sm">
                    <p className="text-xs font-medium text-gray-500 mb-1">Your note</p>
                    <p className="text-gray-800">{order.buyerNote}</p>
                  </div>
                )}
                {order.sellerNote && (
                  <div className="rounded-2xl border border-emerald-50 bg-emerald-50/50 p-4 text-sm">
                    <p className="text-xs font-medium text-emerald-800 mb-1">Seller note</p>
                    <p className="text-emerald-900">{order.sellerNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Actions</h2>
              {canPayOrder(order.status) && (
                <button
                  type="button"
                  onClick={() => navigate(`/buyer/payment/${order.id}`)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <CreditCard size={18} />
                  {order.status === 'AwaitingPayment' ? 'Pay with MoMo' : 'Pay now'}
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  navigate('/messages', {
                    state: {
                      otherUserId: order.sellerUserId,
                      productContext: order.materialId
                        ? {
                            sellerUserId: order.sellerUserId,
                            materialId: order.materialId,
                            title: order.materialTitle,
                          }
                        : undefined,
                    },
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <MessageSquare size={18} />
                Message seller
              </button>
              {canCancelOrder(order.status) && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 hover:bg-rose-100"
                >
                  Cancel order
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 px-1">
              Payment: {order.paymentStatus || '—'}
            </p>
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
}
