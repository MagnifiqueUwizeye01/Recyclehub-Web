import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Flag, AlertTriangle, CheckCircle, Clock, Eye, EyeOff,
  Search, ChevronUp, ChevronDown as ChevronDownIcon, Calendar,
  RefreshCw, Plus, X, SendHorizontal, User, FileText,
} from 'lucide-react';
import SellerLayout from '../../layouts/SellerLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import DashboardStatCard from '../../components/ui/DashboardStatCard';
import ModernPanel from '../../components/ui/ModernPanel';
import { getMyReports, createReport } from '../../api/reports.api';
import toast from 'react-hot-toast';

/* ─── constants ──────────────────────────────────────────────────────────── */
const TABS = [
  { value: 'All',         label: 'All' },
  { value: 'Pending',     label: 'Pending' },
  { value: 'Reviewed',    label: 'Reviewed' },
  { value: 'ActionTaken', label: 'Action taken' },
  { value: 'Dismissed',   label: 'Dismissed' },
];

const REASON_OPTIONS = [
  'Fraudulent activity',
  'Fake order',
  'Abusive behaviour',
  'Payment dispute',
  'False information',
  'Spam',
  'Other',
];

const STATUS_META = {
  Pending:     { cls: 'bg-amber-50 text-amber-800 border border-amber-200',  bar: 'bg-amber-500',  dot: 'bg-amber-500'  },
  Reviewed:    { cls: 'bg-blue-50 text-blue-800 border border-blue-200',     bar: 'bg-blue-500',   dot: 'bg-blue-500'   },
  ActionTaken: { cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  Dismissed:   { cls: 'bg-gray-100 text-gray-600 border border-gray-200',    bar: 'bg-gray-400',   dot: 'bg-gray-400'   },
};

/* ─── tiny components ────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const { cls } = STATUS_META[status] || STATUS_META.Pending;
  const label = status === 'ActionTaken' ? 'Action taken' : (status ?? '—');
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

/** Coloured horizontal bar with percentage */
function ColoredBarRow({ name, count, total, barCls }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 truncate text-gray-600" title={name}>{name}</span>
      <div className="relative h-6 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all duration-700 ${barCls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right tabular-nums text-gray-900 font-medium">{count}</span>
      <span className="w-8 shrink-0 text-right text-xs text-gray-400">{pct}%</span>
    </li>
  );
}

/** SVG resolution ring */
function ResolutionRing({ rate }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const filled = (rate / 100) * circ;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke="url(#srg)" strokeWidth="10"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="srg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Sort chevron */
function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column) return <ChevronDownIcon size={12} className="text-gray-300" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-emerald-600" />
    : <ChevronDownIcon size={12} className="text-emerald-600" />;
}

/* ─── file report modal ──────────────────────────────────────────────────── */
function FileReportModal({ isOpen, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    reportedUserId: '',
    reason: REASON_OPTIONS[0],
    context: '',
    details: '',
  });

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.reportedUserId.trim()) { toast.error('Enter a user ID to report.'); return; }
    if (!form.reason)                { toast.error('Select a reason.'); return; }
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100">
              <Flag size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">File a report</h2>
              <p className="text-xs text-gray-500">Report a buyer or platform user to admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* user ID */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Reported user ID <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="1"
                value={form.reportedUserId}
                onChange={(e) => set('reportedUserId', e.target.value)}
                placeholder="Enter the numeric user ID…"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">Find the user ID on their profile or your order detail.</p>
          </div>

          {/* reason */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={form.reason}
              onChange={(e) => set('reason', e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 px-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300"
            >
              {REASON_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* context */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Context</label>
            <input
              value={form.context}
              onChange={(e) => set('context', e.target.value)}
              placeholder="Short summary (e.g. Order #123, message thread)…"
              className="w-full rounded-xl border border-gray-200 py-2.5 px-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300"
            />
          </div>

          {/* details */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Details</label>
            <textarea
              rows={4}
              value={form.details}
              onChange={(e) => set('details', e.target.value)}
              placeholder="Describe the issue in full. Include dates, order numbers, screenshots if possible…"
              className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300"
            />
          </div>

          {/* footer */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              <SendHorizontal size={15} />
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────────────────────── */
export default function SellerReportsPage() {
  const [tab,        setTab]        = useState('All');
  const [allRows,    setAllRows]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState(null);
  const [search,     setSearch]     = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [sortKey,    setSortKey]    = useState('createdAt');
  const [sortDir,    setSortDir]    = useState('desc');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyReports({ page: 1, pageSize: 500 });
      const pack = res.data;
      const arr  = pack?.items ?? pack?.data ?? [];
      setAllRows(Array.isArray(arr) ? arr : []);
    } catch {
      toast.error('Failed to load your reports.');
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── stats ──────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total       = allRows.length;
    const pending     = allRows.filter((r) => (r.status ?? r.Status) === 'Pending').length;
    const reviewed    = allRows.filter((r) => (r.status ?? r.Status) === 'Reviewed').length;
    const actionTaken = allRows.filter((r) => (r.status ?? r.Status) === 'ActionTaken').length;
    const dismissed   = allRows.filter((r) => (r.status ?? r.Status) === 'Dismissed').length;
    const resolved    = actionTaken + dismissed;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, pending, reviewed, actionTaken, dismissed, resolutionRate };
  }, [allRows]);

  /* ── charts ─────────────────────────────────────────── */
  const chartByStatus = useMemo(() => [
    { name: 'Pending',      count: stats.pending,     barCls: STATUS_META.Pending.bar },
    { name: 'Reviewed',     count: stats.reviewed,    barCls: STATUS_META.Reviewed.bar },
    { name: 'Action taken', count: stats.actionTaken, barCls: STATUS_META.ActionTaken.bar },
    { name: 'Dismissed',    count: stats.dismissed,   barCls: STATUS_META.Dismissed.bar },
  ].filter((d) => d.count > 0), [stats]);

  const chartByReason = useMemo(() => {
    const map = {};
    allRows.forEach((r) => {
      const k = (r.reason ?? r.Reason ?? 'Other').slice(0, 32);
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [allRows]);

  /* ── filtered + sorted rows ─────────────────────────── */
  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (tab !== 'All') rows = rows.filter((r) => (r.status ?? r.Status) === tab);

    if (dateFrom) {
      const from = new Date(dateFrom);
      rows = rows.filter((r) => new Date(r.createdAt ?? r.CreatedAt ?? 0) >= from);
    }
    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59`);
      rows = rows.filter((r) => new Date(r.createdAt ?? r.CreatedAt ?? 0) <= to);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => [
        r.reportedUserName ?? r.ReportedUserName,
        r.reason ?? r.Reason,
        r.context ?? r.Context,
      ].some((f) => String(f ?? '').toLowerCase().includes(q)));
    }

    return [...rows].sort((a, b) => {
      let va, vb;
      if (sortKey === 'createdAt') {
        va = new Date(a.createdAt ?? a.CreatedAt ?? 0).getTime();
        vb = new Date(b.createdAt ?? b.CreatedAt ?? 0).getTime();
      } else if (sortKey === 'reportedName') {
        va = (a.reportedUserName ?? a.ReportedUserName ?? '').toLowerCase();
        vb = (b.reportedUserName ?? b.ReportedUserName ?? '').toLowerCase();
      } else if (sortKey === 'status') {
        va = (a.status ?? a.Status ?? '').toLowerCase();
        vb = (b.status ?? b.Status ?? '').toLowerCase();
      } else { va = 0; vb = 0; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allRows, tab, search, dateFrom, dateTo, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const hasFilters = search || dateFrom || dateTo || tab !== 'All';
  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setTab('All'); };

  /* ── file report ─────────────────────────────────────── */
  const handleFileReport = async (form) => {
    setSubmitting(true);
    try {
      await createReport({
        reportedUserId: Number(form.reportedUserId),
        reason:  form.reason,
        context: form.context.trim() || undefined,
        details: form.details.trim() || undefined,
      });
      toast.success('Report submitted. Admin will review it.');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-6xl space-y-8">

        {/* ── header ──────────────────────────────────────────────── */}
        <ModernPageHeader
          title="My reports"
          description="Reports you have filed against buyers or other users. Admin reviews and takes action."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-emerald-200 hover:bg-gray-50"
              >
                <RefreshCw size={16} className="text-gray-400" />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus size={16} />
                File report
              </button>
            </div>
          }
        />

        {loading ? (
          <PageLoadingCard message="Loading your reports…" />
        ) : (
          <>
            {/* ── stat cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
              <DashboardStatCard
                icon={Flag}
                label="Total filed"
                value={String(stats.total)}
                badge="All time"
                tone="emerald"
              />
              <DashboardStatCard
                icon={Clock}
                label="Pending"
                value={String(stats.pending)}
                badge="Awaiting review"
                tone="amber"
              />
              <DashboardStatCard
                icon={CheckCircle}
                label="Action taken"
                value={String(stats.actionTaken)}
                badge="Resolved"
                tone="violet"
              />
              <DashboardStatCard
                icon={FileText}
                label="Reviewed"
                value={String(stats.reviewed)}
                tone="blue"
              />
            </div>

            {/* ── charts + ring ─────────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* resolution ring */}
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-gray-700">Resolution rate</p>
                <div className="relative">
                  <ResolutionRing rate={stats.resolutionRate} />
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-900">
                    {stats.resolutionRate}%
                  </span>
                </div>
                <p className="text-center text-xs text-gray-500">
                  {stats.actionTaken + stats.dismissed} of {stats.total}{' '}
                  report{stats.total !== 1 ? 's' : ''} resolved
                </p>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {[
                    { label: 'Pending',      dot: 'bg-amber-500',   n: stats.pending },
                    { label: 'Reviewed',     dot: 'bg-blue-500',    n: stats.reviewed },
                    { label: 'Action taken', dot: 'bg-emerald-500', n: stats.actionTaken },
                    { label: 'Dismissed',    dot: 'bg-gray-400',    n: stats.dismissed },
                  ].map(({ label, dot, n }) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className={`h-2 w-2 rounded-full ${dot}`} />
                      {label} <span className="font-medium text-gray-900">{n}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* status bars */}
              <ModernPanel title="By status" subtitle="Count per resolution state">
                {chartByStatus.length === 0 ? (
                  <p className="text-sm text-gray-500">No data yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {chartByStatus.map((d) => (
                      <ColoredBarRow
                        key={d.name}
                        name={d.name}
                        count={d.count}
                        total={stats.total}
                        barCls={d.barCls}
                      />
                    ))}
                  </ul>
                )}
              </ModernPanel>

              {/* reason bars */}
              <ModernPanel title="By reason" subtitle="Most common reasons you filed">
                {chartByReason.length === 0 ? (
                  <p className="text-sm text-gray-500">No data yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {chartByReason.map((d, i) => (
                      <ColoredBarRow
                        key={d.name}
                        name={d.name}
                        count={d.count}
                        total={stats.total}
                        barCls={['bg-emerald-500','bg-teal-500','bg-cyan-500','bg-blue-500','bg-violet-500','bg-amber-500'][i % 6]}
                      />
                    ))}
                  </ul>
                )}
              </ModernPanel>
            </div>

            {/* ── pending banner ──────────────────────────────────── */}
            {stats.pending > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                <AlertTriangle size={18} className="shrink-0 text-amber-600" />
                <span>
                  <span className="font-semibold">{stats.pending} report{stats.pending !== 1 ? 's' : ''}</span>{' '}
                  {stats.pending === 1 ? 'is' : 'are'} pending admin review.
                  We will notify you once they are actioned.
                </span>
                <button
                  type="button"
                  onClick={() => setTab('Pending')}
                  className="ml-auto shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  View pending
                </button>
              </div>
            )}

            {/* ── filters ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by user, reason, context…"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">From date</label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">To date</label>
                <div className="relative">
                  <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-300"
                  />
                </div>
              </div>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* ── status tabs ─────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
              {TABS.map((t) => {
                const count =
                  t.value === 'All'         ? stats.total :
                  t.value === 'Pending'     ? stats.pending :
                  t.value === 'Reviewed'    ? stats.reviewed :
                  t.value === 'ActionTaken' ? stats.actionTaken :
                  stats.dismissed;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTab(t.value)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      tab === t.value
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    {t.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                      tab === t.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
              <span className="ml-auto text-xs text-gray-400">
                {filteredRows.length} result{filteredRows.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* ── table ───────────────────────────────────────────── */}
            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                  <Flag size={26} className="text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No reports found</p>
                <p className="mt-1 text-xs text-gray-500">
                  {hasFilters
                    ? 'Try adjusting your filters or search query.'
                    : "You haven't filed any reports yet."}
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  {hasFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Clear filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    File your first report
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3">
                        <button type="button" onClick={() => toggleSort('reportedName')} className="inline-flex items-center gap-1 hover:text-gray-700">
                          Reported user <SortIcon column="reportedName" sortKey={sortKey} sortDir={sortDir} />
                        </button>
                      </th>
                      <th className="px-4 py-3 max-w-[160px]">Reason</th>
                      <th className="px-4 py-3">Context</th>
                      <th className="px-4 py-3">
                        <button type="button" onClick={() => toggleSort('createdAt')} className="inline-flex items-center gap-1 hover:text-gray-700">
                          Date <SortIcon column="createdAt" sortKey={sortKey} sortDir={sortDir} />
                        </button>
                      </th>
                      <th className="px-4 py-3">
                        <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-1 hover:text-gray-700">
                          Status <SortIcon column="status" sortKey={sortKey} sortDir={sortDir} />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredRows.map((r) => {
                      const id           = r.reportId ?? r.ReportId;
                      const reportedName = r.reportedUserName ?? r.ReportedUserName ?? '—';
                      const status       = r.status ?? r.Status ?? 'Pending';
                      const isOpen       = expanded === id;
                      const { dot }      = STATUS_META[status] || STATUS_META.Pending;

                      return (
                        <Fragment key={id}>
                          <tr className="transition-colors hover:bg-gray-50/80">
                            {/* reported user */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                                  {reportedName?.[0]?.toUpperCase() ?? '?'}
                                  <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${dot}`} />
                                </div>
                                <span className="font-medium text-gray-900">{reportedName}</span>
                              </div>
                            </td>

                            {/* reason */}
                            <td className="max-w-[160px] truncate px-4 py-3 text-gray-800" title={r.reason ?? r.Reason}>
                              {r.reason ?? r.Reason ?? '—'}
                            </td>

                            {/* context */}
                            <td className="px-4 py-3 text-gray-600">
                              {r.context ?? r.Context ?? '—'}
                            </td>

                            {/* date */}
                            <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                              {String(r.createdAt ?? r.CreatedAt ?? '').slice(0, 10) || '—'}
                            </td>

                            {/* status */}
                            <td className="px-4 py-3">
                              <StatusBadge status={status} />
                            </td>

                            {/* expand */}
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => setExpanded(isOpen ? null : id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                              >
                                {isOpen ? <EyeOff size={12} /> : <Eye size={12} />}
                                {isOpen ? 'Hide' : 'View'}
                              </button>
                            </td>
                          </tr>

                          {/* expanded row */}
                          {isOpen && (
                            <tr className="bg-gradient-to-r from-gray-50/80 to-white">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Full details
                                  </p>
                                  <p className="text-sm leading-relaxed text-gray-700">
                                    {r.details ?? r.Details ?? 'No additional details provided.'}
                                  </p>
                                  <div className="mt-3 flex flex-wrap gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                                    <span>Report ID: <strong className="text-gray-700">{String(id)}</strong></span>
                                    <span>Status: <strong className="text-gray-700">{status === 'ActionTaken' ? 'Action taken' : status}</strong></span>
                                    <span>Filed: <strong className="text-gray-700">{String(r.createdAt ?? r.CreatedAt ?? '—').slice(0, 19).replace('T', ' ')}</strong></span>
                                  </div>

                                  {/* status timeline */}
                                  <div className="mt-4 flex items-center gap-0">
                                    {['Pending','Reviewed','ActionTaken'].map((s, i, arr) => {
                                      const statuses = ['Pending','Reviewed','ActionTaken','Dismissed'];
                                      const currentIdx = statuses.indexOf(status);
                                      const stepIdx    = statuses.indexOf(s);
                                      const done       = status !== 'Dismissed' && currentIdx >= stepIdx;
                                      const current    = currentIdx === stepIdx;
                                      return (
                                        <Fragment key={s}>
                                          <div className="flex flex-col items-center gap-1">
                                            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors ${
                                              done
                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                : current
                                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                                  : 'border-gray-200 bg-white text-gray-400'
                                            }`}>
                                              {done && !current ? <CheckCircle size={14} /> : i + 1}
                                            </div>
                                            <span className={`text-xs ${done ? 'text-emerald-700 font-medium' : 'text-gray-400'}`}>
                                              {s === 'ActionTaken' ? 'Action' : s}
                                            </span>
                                          </div>
                                          {i < arr.length - 1 && (
                                            <div className={`mb-5 h-0.5 flex-1 ${done && currentIdx > stepIdx ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                          )}
                                        </Fragment>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>

                {/* footer */}
                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/40 px-4 py-3 text-xs text-gray-500">
                  <span>
                    Showing <strong className="text-gray-700">{filteredRows.length}</strong> of{' '}
                    <strong className="text-gray-700">{stats.total}</strong> report{stats.total !== 1 ? 's' : ''}
                    {tab !== 'All' && (
                      <span className="ml-1 text-gray-400">
                        — &ldquo;{TABS.find((t) => t.value === tab)?.label}&rdquo;
                      </span>
                    )}
                  </span>
                  <span className="text-gray-400">Sorted by {sortKey} ({sortDir})</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* file report modal */}
      <FileReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFileReport}
        submitting={submitting}
      />
    </SellerLayout>
  );
}
