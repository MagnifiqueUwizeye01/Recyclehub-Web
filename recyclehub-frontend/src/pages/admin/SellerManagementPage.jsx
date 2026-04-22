import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ErrorState from '../../components/ui/ErrorState';
import { getSellerProfiles, verifySellerProfile } from '../../api/sellerProfiles.api';
import { resolveUploadedFileUrl } from '../../utils/assetUrl';
import { sendMessage } from '../../api/messages.api';
import AdminMessageModal, { PRESET_MESSAGES } from '../../components/features/AdminMessageModal';
import toast from 'react-hot-toast';

const TABS = ['All', 'Pending', 'Verified', 'Rejected'];

export default function SellerManagementPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState({ open: false, userId: null, company: '', email: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSellerProfiles({
        page,
        pageSize: 15,
        verificationStatus: statusFilter === 'All' ? undefined : statusFilter,
      });
      const pack = res.data;
      const data = pack?.items ?? pack?.data ?? [];
      setSellers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load sellers. Please try again.');
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (userId) => {
    try {
      await verifySellerProfile(userId, { verificationStatus: 'Verified', verificationNote: '' });
      toast.success('Seller verified.');
      load();
    } catch {
      toast.error('Verification failed.');
    }
  };

  const submitReject = async (text) => {
    if (!rejectModal.userId) return;
    try {
      await verifySellerProfile(rejectModal.userId, {
        verificationStatus: 'Rejected',
        verificationNote: text?.slice(0, 500) || 'Rejected by admin',
      });
      await sendMessage({
        receiverUserId: rejectModal.userId,
        messageText: text,
        messageType: 'AdminNotice',
      });
      setRejectModal({ open: false, userId: null, company: '', email: '' });
      load();
    } catch {
      toast.error('Update failed.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Seller verification</h1>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setStatusFilter(t);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                statusFilter === t ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading && (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">Loading sellers...</div>
        )}
        {!loading && error && <ErrorState title="Unable to load sellers" message={error} onRetry={load} />}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-3 font-medium">Company</th>
                  <th className="p-3 font-medium">City</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">License</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => {
                  const userId = seller.userId ?? seller.UserId;
                  const status = seller.verificationStatus ?? seller.VerificationStatus ?? 'Pending';
                  const licenseHref = resolveUploadedFileUrl(seller.licenseDocument ?? seller.LicenseDocument);
                  return (
                    <tr key={seller.sellerProfileId ?? seller.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{seller.companyName}</td>
                      <td className="p-3 text-gray-600">{seller.city}</td>
                      <td className="p-3 text-gray-600">{seller.email}</td>
                      <td className="p-3">
                        {licenseHref ? (
                          <a
                            href={licenseHref}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{status}</span>
                      </td>
                      <td className="p-3">
                        {status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => approve(userId)}
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setRejectModal({
                                  open: true,
                                  userId,
                                  company: seller.companyName || '',
                                  email: seller.email || '',
                                })
                              }
                              className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sellers.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">No sellers found.</div>
            )}
          </div>
        )}
      </div>

      <AdminMessageModal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, userId: null, company: '', email: '' })}
        targetUser={{ name: rejectModal.company, email: rejectModal.email }}
        initialText={PRESET_MESSAGES.find((p) => p.label === 'Seller verification rejected')?.text ?? ''}
        onSend={submitReject}
      />
    </AdminLayout>
  );
}
