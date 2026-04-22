import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  getCertificateRequests,
  approveCertificateRequest,
  rejectCertificateRequest,
} from '../../api/sellerProfiles.api';
import { resolveUploadedFileUrl } from '../../utils/assetUrl';
import AdminMessageModal, { PRESET_MESSAGES } from '../../components/features/AdminMessageModal';
import toast from 'react-hot-toast';

const TABS = ['All', 'Pending', 'Approved', 'Rejected'];

export default function CertificateRequestsPage() {
  const [tab, setTab] = useState('Pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, row: null });

  const load = async () => {
    setLoading(true);
    try {
      const statusMap = { All: undefined, Pending: 'Pending', Approved: 'Approved', Rejected: 'Rejected' };
      const res = await getCertificateRequests({ status: statusMap[tab], page: 1, pageSize: 100 });
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

  const approve = async (row) => {
    try {
      await approveCertificateRequest(row.sellerUserId ?? row.SellerUserId, row.requestId ?? row.RequestId);
      toast.success('Approved.');
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
      toast.success('Rejected.');
      setModal({ open: false, row: null });
      load();
    } catch {
      toast.error('Reject failed.');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Certificate requests</h1>
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                tab === t ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No certificate requests at this time.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-3">Seller</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Certificate</th>
                  <th className="p-3">Authority</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const sid = row.sellerUserId ?? row.SellerUserId;
                  const rid = row.requestId ?? row.RequestId;
                  const doc = row.documentUrl ?? row.DocumentUrl;
                  const docHref = resolveUploadedFileUrl(doc);
                  return (
                    <tr key={rid} className="border-b border-gray-50">
                      <td className="p-3">{row.sellerName ?? row.SellerName}</td>
                      <td className="p-3">{row.companyName ?? row.CompanyName}</td>
                      <td className="p-3">{row.certificateName ?? row.CertificateName}</td>
                      <td className="p-3">{row.issuingAuthority ?? row.IssuingAuthority}</td>
                      <td className="p-3 text-gray-500">{String(row.createdAt ?? row.CreatedAt).slice(0, 10)}</td>
                      <td className="p-3">{row.status ?? row.Status}</td>
                      <td className="p-3 space-x-2 whitespace-nowrap">
                        {docHref && (
                          <a
                            href={docHref}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:underline text-xs"
                          >
                            View
                          </a>
                        )}
                        {(row.status ?? row.Status) === 'Pending' && (
                          <>
                            <button type="button" className="text-xs text-emerald-700 font-semibold" onClick={() => approve(row)}>
                              Approve
                            </button>
                            <button
                              type="button"
                              className="text-xs text-rose-600 font-semibold"
                              onClick={() => setModal({ open: true, row })}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AdminMessageModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, row: null })}
        targetUser={{
          name: modal.row?.sellerName ?? modal.row?.SellerName,
          email: '',
        }}
        initialText={PRESET_MESSAGES.find((p) => p.label === 'Certificate update rejected')?.text ?? ''}
        onSend={reject}
      />
    </AdminLayout>
  );
}
