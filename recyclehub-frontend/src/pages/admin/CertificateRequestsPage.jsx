import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import {
  getCertificateRequests,
  approveCertificateRequest,
  rejectCertificateRequest,
} from '../../api/sellerProfiles.api';
import { resolveUploadedFileUrl } from '../../utils/assetUrl';
import AdminMessageModal, { PRESET_MESSAGES } from '../../components/features/AdminMessageModal';
import toast from 'react-hot-toast';
import {
  Award, CheckCircle, XCircle, Clock, Activity,
  ExternalLink, RefreshCw, Search,
} from 'lucide-react';

const TABS = [
  { value: 'All',      label: 'All',      icon: Activity },
  { value: 'Pending',  label: 'Pending',  icon: Clock },
  { value: 'Approved', label: 'Approved', icon: CheckCircle },
  { value: 'Rejected', label: 'Rejected', icon: XCircle },
];

const STATUS_META = {
  Pending:  { cls: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock,        dot: 'bg-amber-500' },
  Approved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, dot: 'bg-emerald-500' },
  Rejected: { cls: 'bg-red-50 text-red-700 border-red-200',         icon: XCircle,      dot: 'bg-red-500' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.Pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.cls}`}>
      <Icon size={11} />{status}
    </span>
  );
}

export default function CertificateRequestsPage() {
  const [tab,     setTab]     = useState('Pending');
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState({ open: false, row: null });

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

  useEffect(() => { load(); }, [tab]);

  const counts = useMemo(() => ({
    All:      rows.length,
    Pending:  rows.filter((r) => (r.status ?? r.Status) === 'Pending').length,
    Approved: rows.filter((r) => (r.status ?? r.Status) === 'Approved').length,
    Rejected: rows.filter((r) => (r.status ?? r.Status) === 'Rejected').length,
  }), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.sellerName ?? r.SellerName, r.companyName ?? r.CompanyName, r.certificateName ?? r.CertificateName].some((v) => String(v ?? '').toLowerCase().includes(q)));
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
      await rejectCertificateRequest(row.sellerUserId ?? row.SellerUserId, row.requestId ?? row.RequestId, { message: text });
      toast.success('Certificate rejected.');
      setModal({ open: false, row: null });
      load();
    } catch {
      toast.error('Reject failed.');
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <ModernPageHeader
          title="Certificate Requests"
          description="Verify or reject uploaded sustainability certificates from sellers."
          actions={
            <button type="button" onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-emerald-200 hover:bg-gray-50 transition-all">
              <RefreshCw size={16} className="text-gray-400" /> Refresh
            </button>
          }
        />

        {/* stat row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total',    value: rows.length, icon: Award,        bg: 'bg-emerald-100', ic: 'text-emerald-600', blob: 'bg-emerald-50' },
            { label: 'Pending',  value: counts.Pending,  icon: Clock,        bg: 'bg-amber-100',   ic: 'text-amber-600',   blob: 'bg-amber-50' },
            { label: 'Approved', value: counts.Approved, icon: CheckCircle,  bg: 'bg-blue-100',    ic: 'text-blue-600',    blob: 'bg-blue-50' },
            { label: 'Rejected', value: counts.Rejected, icon: XCircle,      bg: 'bg-red-100',     ic: 'text-red-600',     blob: 'bg-red-50' },
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
              placeholder="Search seller, company, certificate…"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" />
          </div>
          <div className="flex flex-wrap gap-2">
            {TABS.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => setTab(value)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${tab === value ? 'bg-emerald-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'}`}>
                <Icon size={14} />
                {label}
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {value === 'All' ? rows.length : counts[value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? <PageLoadingCard message="Loading requests…" /> : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Award size={28} className="text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No requests found</h3>
            <p className="mt-1 text-sm text-gray-500">{search ? 'Try adjusting your search' : 'No certificate requests at this time.'}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-left">
                    {['Seller', 'Company', 'Certificate', 'Authority', 'Submitted', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((row) => {
                    const rid    = row.requestId ?? row.RequestId;
                    const doc    = row.documentUrl ?? row.DocumentUrl;
                    const docHref = resolveUploadedFileUrl(doc);
                    const status = row.status ?? row.Status ?? 'Pending';
                    return (
                      <tr key={rid} className="group transition-colors hover:bg-gray-50/80">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-xs font-bold text-emerald-700">
                              {(row.sellerName ?? row.SellerName ?? '?')[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{row.sellerName ?? row.SellerName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{row.companyName ?? row.CompanyName}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            <Award size={11} className="text-emerald-600" />
                            {row.certificateName ?? row.CertificateName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{row.issuingAuthority ?? row.IssuingAuthority}</td>
                        <td className="px-4 py-3 text-gray-500">{String(row.createdAt ?? row.CreatedAt ?? '').slice(0, 10)}</td>
                        <td className="px-4 py-3"><StatusBadge status={status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {docHref && (
                              <a href={docHref} target="_blank" rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50">
                                <ExternalLink size={11} /> View
                              </a>
                            )}
                            {status === 'Pending' && (
                              <>
                                <button type="button" onClick={() => approve(row)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-all hover:bg-emerald-100">
                                  <CheckCircle size={11} /> Approve
                                </button>
                                <button type="button" onClick={() => setModal({ open: true, row })}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-all hover:bg-red-100">
                                  <XCircle size={11} /> Reject
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
            </div>
            <div className="border-t border-gray-100 bg-gray-50/40 px-4 py-3 text-xs text-gray-500">
              Showing <strong className="text-gray-700">{filtered.length}</strong> requests
            </div>
          </div>
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
