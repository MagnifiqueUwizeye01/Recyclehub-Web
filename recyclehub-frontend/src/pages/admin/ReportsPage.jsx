import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Flag, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff,
  ShieldOff, MessageSquare, RefreshCw, TrendingUp, Users,
  Search, ChevronUp, ChevronDown as ChevronDownIcon, Calendar,
  Filter, Clock, Activity,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import ModernPanel from '../../components/ui/ModernPanel';
import { getReports, updateReportStatus } from '../../api/reports.api';
import { putUserStatus } from '../../api/users.api';
import { sendMessage } from '../../api/messages.api';
import AdminMessageModal from '../../components/features/AdminMessageModal';
import toast from 'react-hot-toast';

/* ─── constants ──────────────────────────────────────────────────────────── */
const TABS = [
  { value: 'All',         label: 'All Reports',    icon: Activity },
  { value: 'Pending',     label: 'Pending Review', icon: Clock },
  { value: 'Reviewed',    label: 'Reviewed',       icon: Eye },
  { value: 'ActionTaken', label: 'Action Taken',   icon: ShieldOff },
  { value: 'Dismissed',   label: 'Dismissed',      icon: XCircle },
];

const STATUS_META = {
  Pending:     { cls: 'bg-amber-50 text-amber-700 border border-amber-200',   bar: 'bg-amber-500',   dot: 'bg-amber-500',   icon: Clock },
  Reviewed:    { cls: 'bg-blue-50 text-blue-700 border border-blue-200',      bar: 'bg-blue-500',    dot: 'bg-blue-500',    icon: Eye },
  ActionTaken: { cls: 'bg-red-50 text-red-700 border border-red-200',         bar: 'bg-red-500',     dot: 'bg-red-500',     icon: ShieldOff },
  Dismissed:   { cls: 'bg-gray-100 text-gray-600 border border-gray-200',     bar: 'bg-gray-400',    dot: 'bg-gray-400',    icon: XCircle },
};

/* ─── stat card ──────────────────────────────────────────────────────────── */
const CARD_TONES = {
  emerald: { icon: 'bg-emerald-100', iconText: 'text-emerald-600', blob: 'bg-emerald-50' },
  amber:   { icon: 'bg-amber-100',   iconText: 'text-amber-600',   blob: 'bg-amber-50' },
  blue:    { icon: 'bg-blue-100',    iconText: 'text-blue-600',    blob: 'bg-blue-50' },
  red:     { icon: 'bg-red-100',     iconText: 'text-red-600',     blob: 'bg-red-50' },
  gray:    { icon: 'bg-gray-100',    iconText: 'text-gray-500',    blob: 'bg-gray-100' },
  violet:  { icon: 'bg-violet-100',  iconText: 'text-violet-600',  blob: 'bg-violet-50' },
};
function StatCard({ title, value, icon: Icon, tone = 'emerald', badge }) {
  const t = CARD_TONES[tone] || CARD_TONES.emerald;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 transition-opacity group-hover:opacity-100 ${t.blob}`} />
      <div className="relative p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.icon}`}>
            <Icon size={20} className={t.iconText} />
          </div>
          {badge && <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">{badge}</span>}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
}

/* ─── animated progress bar ─────────────────────────────────────────────── */
const BAR_COLORS = { amber: 'bg-amber-500', blue: 'bg-blue-500', red: 'bg-red-500', gray: 'bg-gray-400', emerald: 'bg-emerald-500', teal: 'bg-teal-500', cyan: 'bg-cyan-500', violet: 'bg-violet-500' };
function AnimatedProgressBar({ label, count, total, color, icon: Icon }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const barCls = BAR_COLORS[color] || BAR_COLORS.emerald;
  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className={`${CARD_TONES[color]?.iconText || 'text-gray-400'}`} />}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{count}</span>
          <span className="text-xs text-gray-400">({pct.toFixed(0)}%)</span>
        </div>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out ${barCls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── status badge ───────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const { cls, icon: Icon } = STATUS_META[status] || STATUS_META.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      <Icon size={12} />
      {status === 'ActionTaken' ? 'Action taken' : (status ?? '—')}
    </span>
  );
}

/* ─── action button ──────────────────────────────────────────────────────── */
const BTN_VARIANTS = {
  primary: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  danger:  'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  info:    'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  default: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
};
function ActionButton({ onClick, variant = 'default', children, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${BTN_VARIANTS[variant]}`}
    >
      {Icon && <Icon size={12} />}
      {children}
    </button>
  );
}

/* ─── collapsible filter bar ─────────────────────────────────────────────── */
function FilterBar({ search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo, onClear, hasFilters }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, reporter, reason…"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
          >
            <Filter size={14} />
            Filters
            {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700"
            >
              Clear all
            </button>
          )}
        </div>
        {open && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">From date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">To date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── sort icon ──────────────────────────────────────────────────────────── */
function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column) return <ChevronDownIcon size={12} className="text-gray-300" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-emerald-600" />
    : <ChevronDownIcon size={12} className="text-emerald-600" />;
}

/* ─── resolution ring ───────────────────────────────────────────────────── */
function ResolutionRing({ rate }) {
  const r = 44, circ = 2 * Math.PI * r, filled = (rate / 100) * circ;
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
      <circle cx="56" cy="56" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
      <circle cx="56" cy="56" r={r} fill="none" stroke="url(#rg2)" strokeWidth="12"
        strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round" className="transition-all duration-1000" />
      <defs>
        <linearGradient id="rg2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const REASON_COLORS = ['emerald','teal','cyan','blue','violet','amber'];

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function ReportsPage() {
  const [tab,       setTab]       = useState('Pending');
  const [allRows,   setAllRows]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(null);
  const [warnModal, setWarnModal] = useState({ open: false, userId: null, name: '' });
  const [search,    setSearch]    = useState('');
  const [dateFrom,  setDateFrom]  = useState('');
  const [dateTo,    setDateTo]    = useState('');
  const [sortKey,   setSortKey]   = useState('createdAt');
  const [sortDir,   setSortDir]   = useState('desc');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getReports({ page: 1, pageSize: 500 });
      const pack = res.data;
      const arr = pack?.items ?? pack?.data ?? [];
      setAllRows(Array.isArray(arr) ? arr : []);
    } catch {
      toast.error('Failed to load reports.');
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── stats ─────────────────────────────────── */
  const stats = useMemo(() => {
    const total       = allRows.length;
    const pending     = allRows.filter((r) => (r.status ?? r.Status) === 'Pending').length;
    const reviewed    = allRows.filter((r) => (r.status ?? r.Status) === 'Reviewed').length;
    const actionTaken = allRows.filter((r) => (r.status ?? r.Status) === 'ActionTaken').length;
    const dismissed   = allRows.filter((r) => (r.status ?? r.Status) === 'Dismissed').length;
    const uniqueReported = new Set(allRows.map((r) => r.reportedUserId ?? r.ReportedUserId).filter(Boolean)).size;
    const resolved    = actionTaken + dismissed;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, pending, reviewed, actionTaken, dismissed, uniqueReported, resolutionRate };
  }, [allRows]);

  const chartByStatus = useMemo(() => [
    { name: 'Pending',      count: stats.pending,     color: 'amber', icon: Clock },
    { name: 'Reviewed',     count: stats.reviewed,    color: 'blue',  icon: Eye },
    { name: 'Action taken', count: stats.actionTaken, color: 'red',   icon: ShieldOff },
    { name: 'Dismissed',    count: stats.dismissed,   color: 'gray',  icon: XCircle },
  ].filter((d) => d.count > 0), [stats]);

  const chartByReason = useMemo(() => {
    const map = {};
    allRows.forEach((r) => { const k = (r.reason ?? r.Reason ?? 'Other').slice(0, 32); map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [allRows]);

  /* ── filtered rows ──────────────────────────── */
  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (tab !== 'All') rows = rows.filter((r) => (r.status ?? r.Status) === tab);
    if (dateFrom) { const f = new Date(dateFrom); rows = rows.filter((r) => new Date(r.createdAt ?? r.CreatedAt ?? 0) >= f); }
    if (dateTo)   { const t = new Date(`${dateTo}T23:59:59`); rows = rows.filter((r) => new Date(r.createdAt ?? r.CreatedAt ?? 0) <= t); }
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) => [r.reportedUserName ?? r.ReportedUserName, r.reporterName ?? r.ReporterName, r.reason ?? r.Reason, r.context ?? r.Context].some((v) => String(v ?? '').toLowerCase().includes(q)));
    return [...rows].sort((a, b) => {
      let va, vb;
      if (sortKey === 'createdAt')    { va = new Date(a.createdAt ?? a.CreatedAt ?? 0).getTime(); vb = new Date(b.createdAt ?? b.CreatedAt ?? 0).getTime(); }
      else if (sortKey === 'reportedName') { va = (a.reportedUserName ?? a.ReportedUserName ?? '').toLowerCase(); vb = (b.reportedUserName ?? b.ReportedUserName ?? '').toLowerCase(); }
      else if (sortKey === 'status')  { va = (a.status ?? a.Status ?? '').toLowerCase(); vb = (b.status ?? b.Status ?? '').toLowerCase(); }
      else { va = 0; vb = 0; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allRows, tab, search, dateFrom, dateTo, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  /* ── actions ────────────────────────────────── */
  const setStatus = async (id, status) => {
    try { await updateReportStatus(id, status); toast.success('Report updated.'); load(); }
    catch { toast.error('Update failed.'); }
  };

  const suspendUser = async (userId, name) => {
    if (!window.confirm(`Suspend "${name}"? This will prevent them from logging in.`)) return;
    try { await putUserStatus(userId, 'Suspended'); toast.success(`"${name}" suspended.`); load(); }
    catch { toast.error('Could not suspend user.'); }
  };

  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setTab('All'); };
  const hasFilters = !!(search || dateFrom || dateTo || tab !== 'All');

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6">

        {/* header */}
        <ModernPageHeader
          title="Reports Management"
          description="Monitor and moderate user reports, take appropriate actions to maintain community safety."
          actions={
            <button type="button" onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-emerald-200 hover:bg-gray-50"
            >
              <RefreshCw size={16} className="text-gray-400" />
              Refresh
            </button>
          }
        />

        {loading ? <PageLoadingCard message="Loading reports…" /> : (
          <>
            {/* ── stat cards ──────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard title="Total Reports"    value={stats.total}          icon={Flag}     tone="emerald" badge="All time" />
              <StatCard title="Pending"          value={stats.pending}        icon={Clock}    tone="amber"   badge="Needs review" />
              <StatCard title="Reviewed"         value={stats.reviewed}       icon={Eye}      tone="blue" />
              <StatCard title="Action Taken"     value={stats.actionTaken}    icon={ShieldOff} tone="red" />
              <StatCard title="Reported Users"   value={stats.uniqueReported} icon={Users}    tone="violet"  badge="Distinct" />
            </div>

            {/* ── analytics ──────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* resolution ring */}
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <TrendingUp size={12} /> Resolution Rate
                </div>
                <div className="relative">
                  <ResolutionRing rate={stats.resolutionRate} />
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-900">
                    {stats.resolutionRate}%
                  </span>
                </div>
                <p className="text-center text-sm text-gray-600">
                  {stats.actionTaken + stats.dismissed} of {stats.total} reports resolved
                </p>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {[{ label:'Pending', dot:'bg-amber-500', n: stats.pending }, { label:'Reviewed', dot:'bg-blue-500', n: stats.reviewed }, { label:'Action', dot:'bg-red-500', n: stats.actionTaken }, { label:'Dismissed', dot:'bg-gray-400', n: stats.dismissed }].map(({ label, dot, n }) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className={`h-2 w-2 rounded-full ${dot}`} />{label} <strong className="text-gray-900">{n}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* status chart */}
              <ModernPanel title="Status Distribution" subtitle="Reports by resolution state">
                <div className="space-y-4">
                  {chartByStatus.length === 0 ? <p className="text-sm text-gray-500">No data yet.</p> : chartByStatus.map((item) => (
                    <AnimatedProgressBar key={item.name} label={item.name} count={item.count} total={stats.total} color={item.color} icon={item.icon} />
                  ))}
                </div>
              </ModernPanel>

              {/* reason chart */}
              <ModernPanel title="Top Reasons" subtitle="Most frequently reported issues">
                <div className="space-y-3">
                  {chartByReason.length === 0 ? <p className="text-sm text-gray-500">No data yet.</p> : chartByReason.map((r, i) => (
                    <AnimatedProgressBar key={r.name} label={r.name} count={r.count} total={stats.total} color={REASON_COLORS[i % REASON_COLORS.length]} />
                  ))}
                </div>
              </ModernPanel>
            </div>

            {/* ── pending banner ──────────────────── */}
            {stats.pending > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800">Pending Attention</p>
                  <p className="text-sm text-amber-700">
                    {stats.pending} report{stats.pending !== 1 ? 's' : ''} {stats.pending === 1 ? 'requires' : 'require'} your review.
                  </p>
                </div>
                <button type="button" onClick={() => setTab('Pending')}
                  className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors">
                  Review Now
                </button>
              </div>
            )}

            {/* ── filter bar ──────────────────────── */}
            <FilterBar search={search} setSearch={setSearch} dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} onClear={clearFilters} hasFilters={hasFilters} />

            {/* ── status tabs ─────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
              {TABS.map((t) => {
                const count = t.value === 'All' ? stats.total : t.value === 'Pending' ? stats.pending : t.value === 'Reviewed' ? stats.reviewed : t.value === 'ActionTaken' ? stats.actionTaken : stats.dismissed;
                const Icon = t.icon;
                return (
                  <button key={t.value} type="button" onClick={() => setTab(t.value)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${tab === t.value ? 'bg-emerald-600 text-white shadow-md' : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'}`}
                  >
                    <Icon size={14} />
                    {t.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === t.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
                  </button>
                );
              })}
              <span className="ml-auto text-xs text-gray-400">{filteredRows.length} result{filteredRows.length !== 1 ? 's' : ''}</span>
            </div>

            {/* ── table ───────────────────────────── */}
            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Flag size={28} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No reports found</h3>
                <p className="mt-1 text-sm text-gray-500">{hasFilters ? 'Try adjusting your filters' : 'No reports match the current view'}</p>
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        {[['reportedName','Reported User'],['','Reporter'],['','Reason'],['','Context'],['createdAt','Date'],['status','Status']].map(([key, label]) => (
                          <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {key ? (
                              <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-gray-700">
                                {label} <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />
                              </button>
                            ) : label}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredRows.map((r) => {
                        const id           = r.reportId ?? r.ReportId;
                        const reportedId   = r.reportedUserId ?? r.ReportedUserId;
                        const reportedName = r.reportedUserName ?? r.ReportedUserName ?? '—';
                        const status       = r.status ?? r.Status ?? 'Pending';
                        const isOpen       = expanded === id;
                        const { dot }      = STATUS_META[status] || STATUS_META.Pending;
                        return (
                          <Fragment key={id}>
                            <tr className="group transition-colors hover:bg-gray-50/80">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-red-200 text-sm font-bold text-red-700">
                                      {reportedName[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${dot}`} />
                                  </div>
                                  <span className="font-medium text-gray-900">{reportedName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{r.reporterName ?? r.ReporterName ?? '—'}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-700">
                                  {r.reason ?? r.Reason ?? '—'}
                                </span>
                              </td>
                              <td className="max-w-xs truncate px-4 py-3 text-gray-500">{r.context ?? r.Context ?? '—'}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-gray-500">{String(r.createdAt ?? r.CreatedAt ?? '').slice(0, 10) || '—'}</td>
                              <td className="px-4 py-3"><StatusBadge status={status} /></td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap justify-end gap-1.5">
                                  <ActionButton onClick={() => setExpanded(isOpen ? null : id)} variant="default" icon={isOpen ? EyeOff : Eye}>{isOpen ? 'Hide' : 'Details'}</ActionButton>
                                  <ActionButton onClick={() => setWarnModal({ open: true, userId: reportedId, name: reportedName })} variant="warning" icon={MessageSquare}>Warn</ActionButton>
                                  <ActionButton onClick={() => suspendUser(reportedId, reportedName)} variant="danger" icon={ShieldOff}>Suspend</ActionButton>
                                  {status === 'Pending'  && <ActionButton onClick={() => setStatus(id, 'Reviewed')}    variant="info"    icon={CheckCircle}>Review</ActionButton>}
                                  {status === 'Reviewed' && <ActionButton onClick={() => setStatus(id, 'ActionTaken')} variant="danger"  icon={TrendingUp}>Act</ActionButton>}
                                  {status !== 'Dismissed' && <ActionButton onClick={() => setStatus(id, 'Dismissed')} variant="default" icon={XCircle}>Dismiss</ActionButton>}
                                </div>
                              </td>
                            </tr>

                            {isOpen && (
                              <tr className="bg-gradient-to-r from-gray-50/80 to-white">
                                <td colSpan={7} className="px-6 py-4">
                                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                        <Flag size={14} className="text-emerald-600" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Report Details</p>
                                        <p className="text-sm leading-relaxed text-gray-700">{r.details ?? r.Details ?? 'No additional details provided.'}</p>
                                        <div className="mt-3 flex flex-wrap gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                                          <span>Report ID: <strong className="text-gray-700">{String(id)}</strong></span>
                                          <span>User ID: <strong className="text-gray-700">{String(reportedId ?? '—')}</strong></span>
                                          <span>Created: <strong className="text-gray-700">{String(r.createdAt ?? r.CreatedAt ?? '—').slice(0, 19).replace('T', ' ')}</strong></span>
                                        </div>
                                      </div>
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
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/40 px-4 py-3 text-xs text-gray-500">
                  <span>Showing <strong className="text-gray-700">{filteredRows.length}</strong> of <strong className="text-gray-700">{stats.total}</strong> reports</span>
                  <span>Sorted by {sortKey} ({sortDir === 'asc' ? 'ascending' : 'descending'})</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AdminMessageModal
        isOpen={warnModal.open}
        onClose={() => setWarnModal({ open: false, userId: null, name: '' })}
        targetUser={{ name: warnModal.name }}
        onSend={async (text) => {
          await sendMessage({ receiverUserId: warnModal.userId, messageText: text, messageType: 'AdminNotice' });
          toast.success(`Warning sent to ${warnModal.name}`);
        }}
      />
    </AdminLayout>
  );
}
