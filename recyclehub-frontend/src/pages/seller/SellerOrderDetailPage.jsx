import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SellerLayout from '../../layouts/SellerLayout';
import OrderStatusTracker from '../../components/features/OrderStatusTracker';
import StatusChip from '../../components/ui/StatusChip';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { getOrderById, confirmOrder, rejectOrder, shipOrder } from '../../api/orders.api';
import { unwrapApiPayload } from '../../utils/authMapper';
import { formatRWF } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Check, Truck, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    if (!id || id === 'undefined') return;
    return getOrderById(id)
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
      .catch(() => {
        toast.error('Order not found');
        setOrder(null);
      });
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const act = async (kind) => {
    if (!id || id === 'undefined') return;
    try {
      setActing(true);
      if (kind === 'Accepted') await confirmOrder(id);
      else if (kind === 'Rejected') await rejectOrder(id, 'Declined by seller');
      else if (kind === 'Shipped') await shipOrder(id);
      toast.success('Updated');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </SellerLayout>
    );
  }
  if (!order) {
    return (
      <SellerLayout>
        <div className="text-center py-20 text-gray-500">
          <p className="mb-4">Order not found</p>
          <Link to="/seller/orders" className="text-emerald-600 font-medium">
            Back to orders
          </Link>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="mx-auto max-w-3xl animate-fade-in space-y-8 pb-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent md:text-3xl">
              Order #{order.id}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
            <StatusChip status={order.status} />
            <Link to="/seller/orders" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              All orders
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Progress</h2>
          <OrderStatusTracker status={order.status} />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Material</p>
              <p className="font-medium text-gray-900">{order.materialTitle}</p>
            </div>
            <div>
              <p className="text-gray-500">Buyer</p>
              <p className="text-gray-900">{order.buyerFullName || order.buyerUsername || order.buyerEmail}</p>
            </div>
            <div>
              <p className="text-gray-500">Quantity</p>
              <p className="text-gray-900">
                {order.quantityOrdered} {order.unit}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Total</p>
              <p className="text-xl font-semibold text-emerald-700">{formatRWF(order.totalAmount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Payment</p>
              <StatusChip status={order.paymentStatus || 'Pending'} />
            </div>
            {order.shippingAddress && (
              <div className="sm:col-span-2">
                <p className="text-gray-500">Shipping address</p>
                <p className="text-gray-900">{order.shippingAddress}</p>
              </div>
            )}
            {order.buyerNote && (
              <div className="sm:col-span-2">
                <p className="text-gray-500">Buyer note</p>
                <p className="text-gray-800 italic">{order.buyerNote}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {order.status === 'Pending' && (
            <>
              <Button className="flex-1" icon={<Check size={16} />} loading={acting} onClick={() => act('Accepted')}>
                Accept order
              </Button>
              <Button variant="danger" className="flex-1" loading={acting} onClick={() => act('Rejected')}>
                Decline
              </Button>
            </>
          )}
          {order.status === 'Paid' && (
            <Button className="flex-1" icon={<Truck size={16} />} loading={acting} onClick={() => act('Shipped')}>
              Mark shipped
            </Button>
          )}
          <Button
            variant="secondary"
            icon={<MessageSquare size={16} />}
            onClick={() => navigate('/messages', { state: { otherUserId: order.buyerUserId } })}
          >
            Message buyer
          </Button>
        </div>
      </div>
    </SellerLayout>
  );
}
