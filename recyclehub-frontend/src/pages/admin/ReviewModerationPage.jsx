import { useCallback, useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import AdminStatStrip from '../../components/admin/AdminStatStrip';
import AdminSegmentTabs from '../../components/admin/AdminSegmentTabs';
import AdminToolbar from '../../components/admin/AdminToolbar';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminRefreshButton from '../../components/admin/AdminRefreshButton';
import { getAllReviews, updateReviewVisibility } from '../../api/reviews.api';
import { sendMessage } from '../../api/messages.api';
import AdminMessageModal, { PRESET_MESSAGES } from '../../components/features/AdminMessageModal';
import toast from 'react-hot-toast';
import { Star, Eye, EyeOff, MessageSquare } from 'lucide-react';

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={10}
          className={s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
        />
      ))}
      <span className="ml-1 text-[11px] tabular-nums text-gray-600">{rating}</span>
    </div>
  );
}

const TABS = [
  { value: 'All', label: 'All' },
  { value: 'Visible', label: 'Visible' },
  { value: 'Hidden', label: 'Hidden' },
];

export default function ReviewModerationPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [warnModal, setWarnModal] = useState({ open: false, userId: null, name: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllReviews({ pageNumber: 1, pageSize: 200 });
      const pack = res.data;
      const arr = pack?.items ?? pack?.data ?? [];
      setReviews(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reviews.');
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
      toast.success(`Review marked as ${status}.`);
      load();
    } catch {
      toast.error('Failed to update review.');
    }
  };

  const stats = useMemo(() => {
    const total = reviews.length;
    const visible = reviews.filter((r) => (r.status ?? r.Status) === 'Visible').length;
    const hidden = reviews.filter((r) => (r.status ?? r.Status) === 'Hidden').length;
    const avgRaw = reviews.reduce((s, r) => s + (r.rating ?? r.Rating ?? 0), 0);
    const avg = total > 0 ? (avgRaw / total).toFixed(1) : '—';
    return { total, visible, hidden, avg };
  }, [reviews]);

  const filtered = useMemo(() => {
    let rows = reviews;
    if (tab !== 'All') rows = rows.filter((r) => (r.status ?? r.Status) === tab);
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        [r.buyerFullName ?? r.BuyerFullName, r.sellerName ?? r.SellerName, r.comment ?? r.Comment].some((v) =>
          String(v ?? '').toLowerCase().includes(q)
        )
      );
    }
    return rows;
  }, [reviews, tab, search]);

  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    count: t.value === 'All' ? stats.total : t.value === 'Visible' ? stats.visible : stats.hidden,
  }));

  return (
    <AdminLayout>
      <div className="w-full space-y-4">
        <ModernPageHeader
          title="Review Moderation"
          description="Show, hide, or follow up on buyer reviews across the marketplace."
          actions={<AdminRefreshButton onClick={load} />}
        />

        {loading ? (
          <PageLoadingCard message="Loading reviews…" />
        ) : (
          <>
            <AdminStatStrip
              items={[
                { label: 'Total reviews', value: stats.total },
                { label: 'Visible', value: stats.visible },
                { label: 'Hidden', value: stats.hidden },
                { label: 'Avg rating', value: stats.avg },
              ]}
            />

            <AdminSegmentTabs tabs={tabsWithCounts} active={tab} onChange={setTab} />

            <AdminToolbar
              search={search}
              onSearchChange={setSearch}
              placeholder="Search buyer, seller, comment…"
              trailing={`${filtered.length} results`}
            />

            {filtered.length === 0 ? (
              <AdminEmptyState
                icon={Star}
                title="No reviews found"
                description={search ? 'Try adjusting your search.' : 'No reviews match the current filter.'}
              />
            ) : (
              <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
                {filtered.map((review) => {
                  const rid = review.reviewId ?? review.id;
                  const status = review.status ?? review.Status ?? 'Visible';
                  const rating = review.rating ?? review.Rating ?? 0;
                  const buyer = review.buyerFullName || review.BuyerFullName || 'Buyer';
                  const seller = review.sellerName ?? review.SellerName ?? '—';
                  const comment = review.comment || review.Comment || 'No comment';

                  return (
                    <article key={rid} className="px-4 py-3 hover:bg-gray-50/60">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {buyer}
                            <span className="font-normal text-gray-400"> → </span>
                            {seller}
                          </p>
                          <StarRating rating={rating} />
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400">
                          <span
                            className={`rounded px-1.5 py-0.5 font-medium ring-1 ring-inset ${
                              status === 'Visible'
                                ? 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
                                : 'bg-gray-100 text-gray-600 ring-gray-200'
                            }`}
                          >
                            {status}
                          </span>
                          {String(review.createdAt ?? review.CreatedAt ?? '').slice(0, 10)}
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{comment}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {status !== 'Visible' && (
                          <button
                            type="button"
                            onClick={() => setVisibility(rid, 'Visible')}
                            className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
                          >
                            <Eye size={10} /> Show
                          </button>
                        )}
                        {status !== 'Hidden' && (
                          <button
                            type="button"
                            onClick={() => setVisibility(rid, 'Hidden')}
                            className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                          >
                            <EyeOff size={10} /> Hide
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setWarnModal({
                              open: true,
                              userId: review.buyerUserId ?? review.BuyerUserId,
                              name: buyer,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
                        >
                          <MessageSquare size={10} /> Warn user
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
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
          toast.success(`Warning sent to ${warnModal.name}`);
        }}
      />
    </AdminLayout>
  );
}
