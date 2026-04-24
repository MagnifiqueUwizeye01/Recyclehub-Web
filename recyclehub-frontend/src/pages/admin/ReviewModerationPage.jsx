import { useCallback, useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import ModernPanel from '../../components/ui/ModernPanel';
import { getAllReviews, updateReviewVisibility } from '../../api/reviews.api';
import { sendMessage } from '../../api/messages.api';
import AdminMessageModal, { PRESET_MESSAGES } from '../../components/features/AdminMessageModal';
import toast from 'react-hot-toast';
import {
  Star, Eye, EyeOff, MessageSquare, RefreshCw, Search,
  AlertTriangle, CheckCircle, Activity, BarChart3,
} from 'lucide-react';

/* ── helpers ───────────────────────────────────────────────────────────── */
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={12} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-700">{rating}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    Visible: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Hidden:  'bg-gray-100 text-gray-600 border border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] || map.Hidden}`}>
      {status === 'Visible' ? <CheckCircle size={10} /> : <EyeOff size={10} />}
      {status}
    </span>
  );
}

const TABS = [
  { value: 'All',     label: 'All Reviews', icon: Activity },
  { value: 'Visible', label: 'Visible',     icon: Eye },
  { value: 'Hidden',  label: 'Hidden',      icon: EyeOff },
];

/* ── page ──────────────────────────────────────────────────────────────── */
export default function ReviewModerationPage() {
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('All');
  const [search,    setSearch]    = useState('');
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

  useEffect(() => { load(); }, [load]);

  const setVisibility = async (id, status) => {
    try {
      await updateReviewVisibility(id, { status, hiddenReason: status === 'Hidden' ? 'Moderation decision' : null });
      toast.success(`Review marked as ${status}.`);
      load();
    } catch {
      toast.error('Failed to update review.');
    }
  };

  /* stats */
  const stats = useMemo(() => {
    const total   = reviews.length;
    const visible = reviews.filter((r) => (r.status ?? r.Status) === 'Visible').length;
    const hidden  = reviews.filter((r) => (r.status ?? r.Status) === 'Hidden').length;
    const avgRaw  = reviews.reduce((s, r) => s + (r.rating ?? r.Rating ?? 0), 0);
    const avg     = total > 0 ? (avgRaw / total).toFixed(1) : '—';
    return { total, visible, hidden, avg };
  }, [reviews]);

  /* filtered */
  const filtered = useMemo(() => {
    let rows = reviews;
    if (tab !== 'All') rows = rows.filter((r) => (r.status ?? r.Status) === tab);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) =>
      [r.buyerFullName ?? r.BuyerFullName, r.sellerName ?? r.SellerName, r.comment ?? r.Comment].some((v) => String(v ?? '').toLowerCase().includes(q))
    );
    return rows;
  }, [reviews, tab, search]);

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <ModernPageHeader
          title="Review Moderation"
          description="Show, hide, or follow up on buyer reviews across the marketplace."
          actions={
            <button type="button" onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-emerald-200 hover:bg-gray-50 transition-all">
              <RefreshCw size={16} className="text-gray-400" /> Refresh
            </button>
          }
        />

        {loading ? <PageLoadingCard message="Loading reviews…" /> : (
          <>
            {/* stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Total Reviews', value: stats.total,   icon: BarChart3,    bg: 'bg-emerald-100', ic: 'text-emerald-600', blob: 'bg-emerald-50' },
                { label: 'Visible',       value: stats.visible, icon: Eye,          bg: 'bg-blue-100',    ic: 'text-blue-600',    blob: 'bg-blue-50' },
                { label: 'Hidden',        value: stats.hidden,  icon: EyeOff,       bg: 'bg-gray-100',    ic: 'text-gray-500',    blob: 'bg-gray-50' },
                { label: 'Avg Rating',    value: stats.avg,     icon: Star,         bg: 'bg-amber-100',   ic: 'text-amber-600',   blob: 'bg-amber-50' },
              ].map(({ label, value, icon: Icon, bg, ic, blob }) => (
                <div key={label} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-0 transition-opacity group-hover:opacity-100 ${blob}`} />
                  <div className="relative">
                    <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                      <Icon size={18} className={ic} />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* search + tabs */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search buyer, seller, comment…"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
              </div>
              <div className="flex flex-wrap gap-2">
                {TABS.map(({ value, label, icon: Icon }) => {
                  const count = value === 'All' ? stats.total : value === 'Visible' ? stats.visible : stats.hidden;
                  return (
                    <button key={value} type="button" onClick={() => setTab(value)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${tab === value ? 'bg-emerald-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'}`}>
                      <Icon size={14} />
                      {label}
                      <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <span className="ml-auto text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* cards */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Star size={28} className="text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">No reviews found</h3>
                <p className="mt-1 text-sm text-gray-500">{search ? 'Try adjusting your search' : 'No reviews match the current filter'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((review) => {
                  const rid    = review.reviewId ?? review.id;
                  const status = review.status ?? review.Status ?? 'Visible';
                  const rating = review.rating ?? review.Rating ?? 0;
                  const buyer  = review.buyerFullName || review.BuyerFullName || 'Buyer';
                  const seller = review.sellerName ?? review.SellerName ?? '—';
                  const comment = review.comment || review.Comment || 'No comment';
                  return (
                    <div key={rid} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-sm font-bold text-amber-700">
                            {buyer[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{buyer}</p>
                            <p className="text-xs text-gray-500">→ {seller}</p>
                            <StarRating rating={rating} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={status} />
                          <span className="text-xs text-gray-400">{String(review.createdAt ?? review.CreatedAt ?? '').slice(0, 10)}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-gray-600">{comment}</p>
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-50 pt-3">
                        {status !== 'Visible' && (
                          <button type="button" onClick={() => setVisibility(rid, 'Visible')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-all hover:bg-emerald-100">
                            <Eye size={12} /> Show
                          </button>
                        )}
                        {status !== 'Hidden' && (
                          <button type="button" onClick={() => setVisibility(rid, 'Hidden')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-100">
                            <EyeOff size={12} /> Hide
                          </button>
                        )}
                        <button type="button"
                          onClick={() => setWarnModal({ open: true, userId: review.buyerUserId ?? review.BuyerUserId, name: buyer })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-all hover:bg-amber-100">
                          <MessageSquare size={12} /> Warn User
                        </button>
                      </div>
                    </div>
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
          await sendMessage({ receiverUserId: warnModal.userId, messageText: text, messageType: 'AdminNotice' });
          toast.success(`Warning sent to ${warnModal.name}`);
        }}
      />
    </AdminLayout>
  );
}
