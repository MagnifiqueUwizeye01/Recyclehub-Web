import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BuyerLayout from '../../layouts/BuyerLayout';
import PaymentForm from '../../components/features/PaymentForm';
import ErrorState from '../../components/ui/ErrorState';
import { getOrderById } from '../../api/orders.api';
import { getPaymentByOrder } from '../../api/payments.api';
import { unwrapApiPayload } from '../../utils/authMapper';
import { formatRWF } from '../../utils/formatCurrency';
import MtnMomoMark from '../../components/brands/MtnMomoMark';

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const orderRes = await getOrderById(orderId);
      const o = unwrapApiPayload(orderRes);
      setOrder(o);
      try {
        const p = await getPaymentByOrder(orderId);
        setPayment(p);
      } catch (_) {
        setPayment(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load payment details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSuccess = () => {
    if (!orderId) return;
    let elapsed = 0;
    const interval = setInterval(async () => {
      elapsed += 5000;
      try {
        const next = await getPaymentByOrder(orderId);
        setPayment(next);
        if (next?.paymentStatus === 'Successful') {
          clearInterval(interval);
          load();
        }
      } catch (_) {
        /* keep polling */
      }
      if (elapsed >= 120000) clearInterval(interval);
    }, 5000);
  };

  if (!orderId) {
    return (
      <BuyerLayout>
        <ErrorState title="Payment Order Required" message="Please open a payment from your order details page." onRetry={() => navigate('/buyer/orders')} retryLabel="Go to Orders" />
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
        {loading && <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">Loading payment details...</div>}
        {!loading && error && <ErrorState title="Unable to Load Payment" message={error} onRetry={load} />}
        {!loading && !error && order && (
          <>
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">Order</p>
              <p className="font-medium text-gray-900">{order.materialTitle || `Order #${orderId}`}</p>
              <p className="mt-2 text-lg font-semibold text-emerald-700">{formatRWF(order.totalAmount || 0)}</p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-gray-700 sm:flex-row sm:items-center">
              <MtnMomoMark className="h-10 w-auto shrink-0" />
              <p>
                <span className="font-medium text-gray-900">Payment method:</span> MTN Mobile Money (MoMo) only. Enter the wallet number that will receive the payment prompt.
              </p>
            </div>

            {payment?.paymentStatus === 'Successful' ? (
              <div className="rounded-2xl border border-emerald-200 bg-white p-6 text-sm text-emerald-700 shadow-sm space-y-3">
                <p>Payment successful. Your order is confirmed and the seller has been notified.</p>
                <button type="button" onClick={() => navigate(`/buyer/orders/${orderId}`)} className="text-emerald-800 font-semibold hover:underline">
                  View order
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <PaymentForm order={order} paymentMethod="MobileMoney" onSuccess={handleSuccess} />
                {(payment?.paymentStatus === 'Pending' || payment?.paymentStatus === 'Requested') && (
                  <p className="mt-3 text-sm text-gray-600">Waiting for payment confirmation on your phone…</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </BuyerLayout>
  );
}
