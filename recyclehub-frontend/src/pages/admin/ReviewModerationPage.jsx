import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ErrorState from '../../components/ui/ErrorState';
import { getAllReviews, updateReviewVisibility } from '../../api/reviews.api';
import { sendMessage } from '../../api/messages.api';
import AdminMessageModal, { PRESET_MESSAGES } from '../../components/features/AdminMessageModal';

export default function ReviewModerationPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warnModal, setWarnModal] = useState({ open: false, userId: null, name: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllReviews({ pageNumber: 1, pageSize: 100 });
      const pack = res.data;
      const arr = pack?.items ?? pack?.data ?? [];
      setReviews(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setVisibility = async (id, status) => {
    try {
      await updateReviewVisibility(id, {
        status,
        hiddenReason: status === 'Hidden' ? 'Moderation decision' : null,
      });
      load();
    } catch (err) {
      console.error(err);
      setError('Failed to update review. Please try again.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Review moderation</h1>
        {loading && (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">Loading reviews...</div>
        )}
        {!loading && error && <ErrorState title="Unable to load reviews" message={error} onRetry={load} />}
        {!loading && !error && (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.reviewId ?? review.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <p className="font-medium text-gray-900">{review.buyerFullName || review.BuyerFullName || 'Buyer'}</p>
                <p className="text-sm text-gray-600 mt-1">{review.comment || review.Comment || 'No comment'}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Rating: {review.rating ?? review.Rating} · Status: {review.status ?? review.Status}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility(review.reviewId ?? review.id, 'Visible')}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white"
                  >
                    Show
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility(review.reviewId ?? review.id, 'Hidden')}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700"
                  >
                    Hide
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setWarnModal({
                        open: true,
                        userId: review.buyerUserId ?? review.BuyerUserId,
                        name: review.buyerFullName || review.BuyerFullName || 'User',
                      })
                    }
                    className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs text-amber-800"
                  >
                    Warn user
                  </button>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">No reviews found.</div>
            )}
          </div>
        )}
      </div>
      <AdminMessageModal
        isOpen={warnModal.open}
        onClose={() => setWarnModal({ open: false, userId: null, name: '' })}
        targetUser={{ name: warnModal.name }}
        initialText={PRESET_MESSAGES.find((p) => p.label === 'Account warning')?.text ?? ''}
        onSend={async (text) => {
          await sendMessage({
            receiverUserId: warnModal.userId,
            messageText: text,
            messageType: 'AdminNotice',
          });
        }}
      />
    </AdminLayout>
  );
}
