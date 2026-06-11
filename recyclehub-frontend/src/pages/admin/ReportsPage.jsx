import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Flag, ChevronUp, ChevronDown as ChevronDownIcon, Calendar, Filter,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import ModernPanel from '../../components/ui/ModernPanel';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import AdminStatStrip from '../../components/admin/AdminStatStrip';
import AdminSegmentTabs from '../../components/admin/AdminSegmentTabs';
import AdminToolbar from '../../components/admin/AdminToolbar';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminRefreshButton from '../../components/admin/AdminRefreshButton';
import DistributionMosaic from '../../components/admin/DistributionMosaic';
import WeightedTags from '../../components/admin/WeightedTags';
import { getReports, updateReportStatus } from '../../api/reports.api';
import { putUserStatus } from '../../api/users.api';
import { sendMessage } from '../../api/messages.api';
import AdminMessageModal from '../../components/features/AdminMessageModal';
import toast from 'react-hot-toast';

const TABS = [
  { value: 'All', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Reviewed', label: 'Reviewed' },
  { value: 'ActionTaken', label: 'Action taken' },
  { value: 'Dismissed', label: 'Dismissed' },
];

const STATUS_META = {
  Pending: { cls: 'bg-amber-50 text-amber-800 ring-amber-200/80', label: 'Pending' },
  Reviewed: { cls: 'bg-blue-50 text-blue-800 ring-blue-200/80', label: 'Reviewed' },
  ActionTaken: { cls: 'bg-red-50 text-red-800 ring-red-200/80', label: 'Action taken' },
  Dismissed: { cls: 'bg-gray-100 text-gray-600 ring-gray-200', label: 'Dismissed' },
};

const STATUS_COLORS = {
  Pending: '#d97706',
  Reviewed: '#2563eb',
  'Action taken': '#dc2626',
  Dismissed: '#64748b',
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.Pending;
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column) return <ChevronDownIcon size={11} className="text-gray-300" />;
  return sortDir === 'asc' ? (
    <ChevronUp size={11} className="text-emerald-600" />
  ) : (
    <ChevronDownIcon size={11} className="text-emerald-600" />
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('Pending');
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [warnModal, setWarnModal] = useState({ open: false, userId: null, name: '' });
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

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

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = allRows.length;
    const pending = allRows.filter((r) => (r.status ?? r.Status) === 'Pending').length;
    const reviewed = allRows.filter((r) => (r.status ?? r.Status) === 'Reviewed').length;
    const actionTaken = allRows.filter((r) => (r.status ?? r.Status) === 'ActionTaken').length;
    const dismissed = allRows.filter((r) => (r.status ?? r.Status) === 'Dismissed').length;
    const uniqueReported = new Set(allRows.map((r) => r.reportedUserId ?? r.ReportedUserId).filter(Boolean)).size;
    const resolved = actionTaken + dismissed;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, pending, reviewed, actionTaken, dismissed, uniqueReported, resolutionRate };
  }, [allRows]);

  const chartByStatus = useMemo(
    () =>
      [
        { name: 'Pending', count: stats.pending },
        { name: 'Reviewed', count: stats.reviewed },
        { name: 'Action taken', count: stats.actionTaken },
        { name: 'Dismissed', count: stats.dismissed },
      ].filter((d) => d.count > 0),
    [stats]
  );

  const chartByReason = useMemo(() => {
    const map = {};
    allRows.forEach((r) => {
      const k = (r.reason ?? r.Reason ?? 'Other').slice(0, 40);
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [allRows]);

  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (tab !== 'All') rows = rows.filter((r) => (r.status ?? r.Status) === tab);
    if (dateFrom) {
      const f = new Date(dateFrom);
      rows = rows.filter((r) => new Date(r.createdAt ?? r.CreatedAt ?? 0) >= f);
    }
    if (dateTo) {
      const t = new Date(`${dateTo}T23:59:59`);
      rows = rows.filter((r) => new Date(r.createdAt ?? r.CreatedAt ?? 0) <= t);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        [r.reportedUserName ?? r.ReportedUserName, r.reporterName ?? r.ReporterName, r.reason ?? r.Reason, r.context ?? r.Context].some(
          (v) => String(v ?? '').toLowerCase().includes(q)
        )
      );
    }
    return [...rows].sort((a, b) => {
      let va;
      let vb;
      if (sortKey === 'createdAt') {
        va = new Date(a.createdAt ?? a.CreatedAt ?? 0).getTime();
        vb = new Date(b.createdAt ?? b.CreatedAt ?? 0).getTime();
      } else if (sortKey === 'reportedName') {
        va = (a.reportedUserName ?? a.ReportedUserName ?? '').toLowerCase();
        vb = (b.reportedUserName ?? b.ReportedUserName ?? '').toLowerCase();
      } else if (sortKey === 'status') {
        va = (a.status ?? a.Status ?? '').toLowerCase();
        vb = (b.status ?? b.Status ?? '').toLowerCase();
      } else {
        va = 0;
        vb = 0;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allRows, tab, search, dateFrom, dateTo, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const setStatus = async (id, status) => {
    try {
      await updateReportStatus(id, status);
      toast.success('Report updated.');
      load();
    } catch {
      toast.error('Update failed.');
    }
  };

  const suspendUser = async (userId, name) => {
    if (!window.confirm(`Suspend "${name}"? This will prevent them from logging in.`)) return;
    try {
      await putUserStatus(userId, 'Suspended');
      toast.success(`"${name}" suspended.`);
      load();
    } catch {
      toast.error('Could not suspend user.');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setTab('All');
  };
  const hasFilters = !!(search || dateFrom || dateTo || tab !== 'All');

  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    count:
      t.value === 'All'
        ? stats.total
        : t.value === 'Pending'
          ? stats.pending
          : t.value === 'Reviewed'
            ? stats.reviewed
            : t.value === 'ActionTaken'
              ? stats.actionTaken
              : stats.dismissed,
  }));

  return (
    <AdminLayout>
      <div className="w-full space-y-4">
        <ModernPageHeader
          title="Reports Management"
          description="Monitor and moderate user reports to maintain community safety."
          actions={<AdminRefreshButton onClick={load} />}
        />

        {loading ? (
          <PageLoadingCard message="Loading reports…" />
        ) : (
          <>
            <AdminStatStrip
              items={[
                { label: 'Total reports', value: stats.total },
                { label: 'Pending', value: stats.pending, hint: 'Needs review' },
                { label: 'Reviewed', value: stats.reviewed },
                { label: 'Action taken', value: stats.actionTaken },
                { label: 'Resolution rate', value: `${stats.resolutionRate}%`, hint: `${stats.actionTaken + stats.dismissed} closed` },
                { label: 'Distinct users', value: stats.uniqueReported },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ModernPanel title="Status breakdown" subtitle="Share of reports by state">
                <DistributionMosaic data={chartByStatus} colorMap={STATUS_COLORS} />
              </ModernPanel>
              <ModernPanel title="Report reasons" subtitle="Weighted by frequency">
                <WeightedTags data={chartByReason} total={stats.total} />
              </ModernPanel>
            </div>

            {stats.pending > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm">
                <p className="text-amber-900">
                  <span className="font-medium">{stats.pending}</span> report{stats.pending !== 1 ? 's' : ''} awaiting
                  review.
                </p>
                <button
                  type="button"
                  onClick={() => setTab('Pending')}
                  className="rounded-md bg-amber-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-800"
                >
                  Review pending
                </button>
              </div>
            )}

            <AdminSegmentTabs tabs={tabsWithCounts} active={tab} onChange={setTab} />

            <div className="space-y-2">
              <AdminToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Search by user, reporter, reason…"
                trailing={`${filteredRows.length} results`}
              >
                <button
                  type="button"
                  onClick={() => setFiltersOpen((o) => !o)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                >
                  <Filter size={12} />
                  Dates
                  {(dateFrom || dateTo) && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </button>
                {hasFilters && (
                  <button type="button" onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-800">
                    Clear all
                  </button>
                )}
              </AdminToolbar>
              {filtersOpen && (
                <div className="flex flex-wrap gap-3 rounded-md border border-gray-200 bg-white p-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      From
                    </label>
                    <div className="relative">
                      <Calendar size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-md border border-gray-200 py-1.5 pl-7 pr-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
                      To
                    </label>
                    <div className="relative">
                      <Calendar size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-md border border-gray-200 py-1.5 pl-7 pr-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {filteredRows.length === 0 ? (
              <AdminEmptyState
                icon={Flag}
                title="No reports found"
                description={hasFilters ? 'Try adjusting your filters.' : 'No reports match the current view.'}
              />
            ) : (
              <AdminDataTable
                footer={
                  <>
                    Showing <strong className="text-gray-700">{filteredRows.length}</strong> of{' '}
                    <strong className="text-gray-700">{stats.total}</strong> reports
                  </>
                }
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80 text-left">
                      {[
                        ['reportedName', 'Reported user'],
                        [null, 'Reporter'],
                        [null, 'Reason'],
                        [null, 'Context'],
                        ['createdAt', 'Date'],
                        ['status', 'Status'],
                      ].map(([key, label]) => (
                        <th
                          key={label}
                          className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500"
                        >
                          {key ? (
                            <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1">
                              {label} <SortIcon column={key} sortKey={sortKey} sortDir={sortDir} />
                            </button>
                          ) : (
                            label
                          )}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredRows.map((r) => {
                      const id = r.reportId ?? r.ReportId;
                      const reportedId = r.reportedUserId ?? r.ReportedUserId;
                      const reportedName = r.reportedUserName ?? r.ReportedUserName ?? '—';
                      const status = r.status ?? r.Status ?? 'Pending';
                      const isOpen = expanded === id;
                      return (
                        <Fragment key={id}>
                          <tr className="hover:bg-gray-50/70">
                            <td className="px-3 py-2 font-medium text-gray-900">{reportedName}</td>
                            <td className="px-3 py-2 text-gray-600">{r.reporterName ?? r.ReporterName ?? '—'}</td>
                            <td className="px-3 py-2 text-gray-700">{r.reason ?? r.Reason ?? '—'}</td>
                            <td className="max-w-[10rem] truncate px-3 py-2 text-gray-500">
                              {r.context ?? r.Context ?? '—'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                              {String(r.createdAt ?? r.CreatedAt ?? '').slice(0, 10) || '—'}
                            </td>
                            <td className="px-3 py-2">
                              <StatusBadge status={status} />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setExpanded(isOpen ? null : id)}
                                  className="rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50"
                                >
                                  {isOpen ? 'Hide' : 'Details'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setWarnModal({ open: true, userId: reportedId, name: reportedName })}
                                  className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800 hover:bg-amber-100"
                                >
                                  Warn
                                </button>
                                <button
                                  type="button"
                                  onClick={() => suspendUser(reportedId, reportedName)}
                                  className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] text-red-800 hover:bg-red-100"
                                >
                                  Suspend
                                </button>
                                {status === 'Pending' && (
                                  <button
                                    type="button"
                                    onClick={() => setStatus(id, 'Reviewed')}
                                    className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-800 hover:bg-blue-100"
                                  >
                                    Review
                                  </button>
                                )}
                                {status === 'Reviewed' && (
                                  <button
                                    type="button"
                                    onClick={() => setStatus(id, 'ActionTaken')}
                                    className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] text-red-800 hover:bg-red-100"
                                  >
                                    Act
                                  </button>
                                )}
                                {status !== 'Dismissed' && (
                                  <button
                                    type="button"
                                    onClick={() => setStatus(id, 'Dismissed')}
                                    className="rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50"
                                  >
                                    Dismiss
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isOpen && (
                            <tr className="bg-gray-50/50">
                              <td colSpan={7} className="px-4 py-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                  Details
                                </p>
                                <p className="mt-1 text-sm text-gray-700">
                                  {r.details ?? r.Details ?? 'No additional details provided.'}
                                </p>
                                <p className="mt-2 text-[11px] text-gray-500">
                                  ID {String(id)} · User {String(reportedId ?? '—')}
                                </p>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </AdminDataTable>
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
