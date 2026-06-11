import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import AdminStatStrip from '../../components/admin/AdminStatStrip';
import AdminSegmentTabs from '../../components/admin/AdminSegmentTabs';
import AdminToolbar from '../../components/admin/AdminToolbar';
import AdminEmptyState from '../../components/admin/AdminEmptyState';
import AdminDataTable, { AdminTableHead } from '../../components/admin/AdminDataTable';
import AdminRefreshButton from '../../components/admin/AdminRefreshButton';
import {
  getCertificateRequests,
  approveCertificateRequest,
  rejectCertificateRequest,
} from '../../api/sellerProfiles.api';
import { resolveUploadedFileUrl } from '../../utils/assetUrl';
import AdminMessageModal, { PRESET_MESSAGES } from '../../components/features/AdminMessageModal';
import toast from 'react-hot-toast';
import { Award, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

const TABS = [
  { value: 'All', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
];

const STATUS_CLS = {
  Pending: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  Approved: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  Rejected: 'bg-red-50 text-red-800 ring-red-200/80',
};

export default function CertificateRequestsPage() {
  const [tab, setTab] = useState('Pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, row: null });

  const load = async () => {
    setLoading(true);
    try {
      const statusMap = { All: undefined, Pending: 'Pending', Approved: 'Approved', Rejected: 'Rejected' };
      const res = await getCertificateRequests({ status: statusMap[tab], page: 1, pageSize: 200 });
      const pack = res.data;
      const arr = pack?.items ?? pack?.data ?? [];
      setRows(Array.isArray(arr) ? arr : []);
    } catch {
      toast.error('Failed to load certificate requests.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const counts = useMemo(
    () => ({
      All: rows.length,
      Pending: rows.filter((r) => (r.status ?? r.Status) === 'Pending').length,
      Approved: rows.filter((r) => (r.status ?? r.Status) === 'Approved').length,
      Rejected: rows.filter((r) => (r.status ?? r.Status) === 'Rejected').length,
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.sellerName ?? r.SellerName, r.companyName ?? r.CompanyName, r.certificateName ?? r.CertificateName].some(
        (v) => String(v ?? '').toLowerCase().includes(q)
      )
    );
  }, [rows, search]);

  const approve = async (row) => {
    try {
      await approveCertificateRequest(row.sellerUserId ?? row.SellerUserId, row.requestId ?? row.RequestId);
      toast.success('Certificate approved.');
      load();
    } catch {
      toast.error('Approve failed.');
    }
  };

  const reject = async (text) => {
    const row = modal.row;
    if (!row) return;
    try {
      await rejectCertificateRequest(row.sellerUserId ?? row.SellerUserId, row.requestId ?? row.RequestId, {
        message: text,
      });
      toast.success('Certificate rejected.');
      setModal({ open: false, row: null });
      load();
    } catch {
      toast.error('Reject failed.');
    }
  };

  const tabsWithCounts = TABS.map((t) => ({ ...t, count: t.value === 'All' ? rows.length : counts[t.value] }));

  return (
    <AdminLayout>
      <div className="w-full space-y-4">
        <ModernPageHeader
          title="Certificate Requests"
          description="Verify or reject uploaded sustainability certificates from sellers."
          actions={<AdminRefreshButton onClick={load} />}
        />

        <AdminStatStrip
          items={[
            { label: 'Total', value: rows.length },
            { label: 'Pending', value: counts.Pending },
            { label: 'Approved', value: counts.Approved },
            { label: 'Rejected', value: counts.Rejected },
          ]}
        />

        <AdminSegmentTabs tabs={tabsWithCounts} active={tab} onChange={setTab} />

        <AdminToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search seller, company, certificate…"
          trailing={`${filtered.length} shown`}
        />

        {loading ? (
          <PageLoadingCard message="Loading requests…" />
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            icon={Award}
            title="No requests found"
            description={search ? 'Try adjusting your search.' : 'No certificate requests at this time.'}
          />
        ) : (
          <AdminDataTable
            footer={
              <>
                Showing <strong className="text-gray-700">{filtered.length}</strong> requests
              </>
            }
          >
            <table className="w-full text-sm">
              <AdminTableHead
                columns={['Seller', 'Company', 'Certificate', 'Authority', 'Submitted', 'Status', 'Actions']}
              />
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row) => {
                  const rid = row.requestId ?? row.RequestId;
                  const docHref = resolveUploadedFileUrl(row.documentUrl ?? row.DocumentUrl);
                  const status = row.status ?? row.Status ?? 'Pending';
                  return (
                    <tr key={rid} className="hover:bg-gray-50/70">
                      <td className="px-3 py-2 font-medium text-gray-900">{row.sellerName ?? row.SellerName}</td>
                      <td className="px-3 py-2 text-gray-600">{row.companyName ?? row.CompanyName}</td>
                      <td className="px-3 py-2 text-gray-700">{row.certificateName ?? row.CertificateName}</td>
                      <td className="px-3 py-2 text-gray-500">{row.issuingAuthority ?? row.IssuingAuthority}</td>
                      <td className="px-3 py-2 text-gray-500">
                        {String(row.createdAt ?? row.CreatedAt ?? '').slice(0, 10)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${STATUS_CLS[status] || STATUS_CLS.Pending}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {docHref && (
                            <a
                              href={docHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50"
                            >
                              <ExternalLink size={10} /> View
                            </a>
                          )}
                          {status === 'Pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => approve(row)}
                                className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
                              >
                                <CheckCircle size={10} /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setModal({ open: true, row })}
                                className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-800 hover:bg-red-100"
                              >
                                <XCircle size={10} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminDataTable>
        )}
      </div>

      <AdminMessageModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, row: null })}
        targetUser={{ name: modal.row?.sellerName ?? modal.row?.SellerName, email: '' }}
        initialText={PRESET_MESSAGES.find((p) => p.label === 'Certificate update rejected')?.text ?? ''}
        onSend={reject}
      />
    </AdminLayout>
  );
}
