import { useEffect, useState, Fragment } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { getReports, updateReportStatus } from '../../api/reports.api';
import { putUserStatus } from '../../api/users.api';
import { sendMessage } from '../../api/messages.api';
import AdminMessageModal from '../../components/features/AdminMessageModal';
import toast from 'react-hot-toast';

const TABS = ['All', 'Pending', 'Reviewed', 'ActionTaken', 'Dismissed'];

const statusChip = (s) => {
  const map = {
    Pending: 'bg-amber-100 text-amber-800 border-amber-200',
    Reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
    ActionTaken: 'bg-red-100 text-red-800 border-red-200',
    Dismissed: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return map[s] || map.Pending;
};

export default function ReportsPage() {
  const [tab, setTab] = useState('Pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [warnModal, setWarnModal] = useState({ open: false, userId: null, name: '' });

  const load = async () => {
    setLoading(true);
    try {
      const statusMap = {
        All: undefined,
        Pending: 'Pending',
        Reviewed: 'Reviewed',
        ActionTaken: 'ActionTaken',
        Dismissed: 'Dismissed',
      };
      const res = await getReports({ status: statusMap[tab], page: 1, pageSize: 100 });
      const pack = res.data;
      const arr = pack?.items ?? pack?.data ?? [];
      setRows(Array.isArray(arr) ? arr : []);
    } catch {
      toast.error('Failed to load reports.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const setStatus = async (id, status) => {
    try {
      await updateReportStatus(id, status);
      toast.success('Updated.');
      load();
    } catch {
      toast.error('Update failed.');
    }
  };

  const suspendUser = async (userId) => {
    try {
      await putUserStatus(userId, 'Suspended');
      toast.success('User suspended.');
    } catch {
      toast.error('Could not suspend.');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                tab === t ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No reports.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-3">Reported</th>
                  <th className="p-3">Reporter</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Context</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const id = r.reportId ?? r.ReportId;
                  const reportedId = r.reportedUserId ?? r.ReportedUserId;
                  return (
                    <Fragment key={id}>
                      <tr className="border-b border-gray-50">
                        <td className="p-3">{r.reportedUserName ?? r.ReportedUserName}</td>
                        <td className="p-3">{r.reporterName ?? r.ReporterName}</td>
                        <td className="p-3 max-w-[180px] truncate">{r.reason ?? r.Reason}</td>
                        <td className="p-3">{r.context ?? r.Context}</td>
                        <td className="p-3 text-gray-500">{String(r.createdAt ?? r.CreatedAt).slice(0, 10)}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-full border ${statusChip(r.status ?? r.Status)}`}>
                            {r.status ?? r.Status}
                          </span>
                        </td>
                        <td className="p-3 space-y-1">
                          <button type="button" className="text-xs text-emerald-700 block" onClick={() => setExpanded(expanded === id ? null : id)}>
                            {expanded === id ? 'Hide' : 'Details'}
                          </button>
                          <button
                            type="button"
                            className="text-xs text-amber-700 block"
                            onClick={() =>
                              setWarnModal({ open: true, userId: reportedId, name: r.reportedUserName ?? '' })
                            }
                          >
                            Warn user
                          </button>
                          <button type="button" className="text-xs text-red-700 block" onClick={() => suspendUser(reportedId)}>
                            Suspend
                          </button>
                          <button type="button" className="text-xs text-gray-600 block" onClick={() => setStatus(id, 'Dismissed')}>
                            Dismiss
                          </button>
                        </td>
                      </tr>
                      {expanded === id && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="p-4 text-sm text-gray-700">
                            {r.details ?? r.Details ?? '—'}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AdminMessageModal
        isOpen={warnModal.open}
        onClose={() => setWarnModal({ open: false, userId: null, name: '' })}
        targetUser={{ name: warnModal.name }}
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
