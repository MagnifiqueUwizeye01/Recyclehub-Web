import { useCallback, useEffect, useState } from 'react';
import BuyerLayout from '../../layouts/BuyerLayout';
import ErrorState from '../../components/ui/ErrorState';
import ReviewCard from '../../components/features/ReviewCard';
import { getBuyerReviews } from '../../api/reviews.api';
import { getBuyerOrders } from '../../api/orders.api';
import { useAuth } from '../../hooks/useAuth';

export default function ReviewsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('pending');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const userId = user?.userId ?? user?.id;
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const [ordersRes, reviewsRes] = await Promise.all([
        getBuyerOrders({ status: 'Delivered', pageNumber: 1, pageSize: 50 }).catch(() => ({ data: {} })),
        getBuyerReviews(userId, { pageNumber: 1, pageSize: 50 }).catch(() => ({ data: {} })),
      ]);
      const packO = ordersRes.data;
      const packR = reviewsRes.data;
      const orders = packO?.items ?? packO?.data ?? [];
      const reviews = packR?.items ?? packR?.data ?? [];
      const orderArr = Array.isArray(orders) ? orders : [];
      const reviewArr = Array.isArray(reviews) ? reviews : [];
      const reviewedOrderIds = new Set(reviewArr.map((r) => r.orderId ?? r.OrderId));
      setPendingOrders(orderArr.filter((o) => !reviewedOrderIds.has(o.orderId ?? o.id ?? o.Id)));
      setMyReviews(reviewArr);
    } catch (err) {
      console.error(err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.userId, user?.id]);

  useEffect(() => {
    if (!user?.id && !user?.userId) return;
    load();
  }, [load, user?.id, user?.userId]);

  return (
    <BuyerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Reviews</h1>
          <p className="text-sm text-gray-500">Complete a delivery to leave your first review.</p>
        </div>

        <div className="flex gap-2 border-b border-gray-100 pb-2">
          {[
            { id: 'pending', label: 'Pending Reviews' },
            { id: 'written', label: 'Reviews Written' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">Loading reviews...</div>
        )}
        {!loading && error && <ErrorState title="Unable to load reviews" message={error} onRetry={load} />}
        {!loading && !error && tab === 'pending' && pendingOrders.length === 0 && (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">
            No pending reviews. Delivered orders you have not reviewed will appear here.
          </div>
        )}
        {!loading && !error && tab === 'pending' && pendingOrders.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingOrders.map((o) => (
              <div key={o.orderId ?? o.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm text-sm">
                <p className="font-medium text-gray-900">{o.materialTitle || o.MaterialTitle || 'Order'}</p>
                <p className="text-gray-500 mt-1">Leave a review from your order details after delivery.</p>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && tab === 'written' && myReviews.length === 0 && (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">
            No reviews yet. Complete a delivery to leave your first review.
          </div>
        )}
        {!loading && !error && tab === 'written' && myReviews.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {myReviews.map((review) => (
              <ReviewCard key={review.reviewId ?? review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
