import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ErrorState from '../../components/ui/ErrorState';
import { getUsers } from '../../api/users.api';
import { getSellerProfiles } from '../../api/sellerProfiles.api';
import { getAllPayments } from '../../api/payments.api';
import { getPagedItems } from '../../utils/pagedResponse';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingVerifications: 0,
    totalPayments: 0,
  });
  const [pendingSellers, setPendingSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let totalUsers = 0;
      let pendingVerifications = 0;
      let totalPayments = 0;

      try {
        const r = await getUsers({ pageSize: 1, pageNumber: 1 });
        const p = getPagedItems(r);
        totalUsers = p.totalCount;
      } catch (e) {
        console.warn('Users count failed:', e.message);
      }

      try {
        const r = await getSellerProfiles({ verificationStatus: 'Pending', pageSize: 5, pageNumber: 1 });
        const p = getPagedItems(r);
        setPendingSellers(Array.isArray(p.items) ? p.items : []);
        pendingVerifications = p.totalCount;
      } catch (e) {
        console.warn('Sellers failed:', e.message);
        setPendingSellers([]);
      }

      try {
        const r = await getAllPayments({ pageSize: 1, pageNumber: 1 });
        const p = getPagedItems(r);
        totalPayments = p.totalCount;
      } catch (e) {
        console.warn('Payments failed:', e.message);
      }

      setStats({
        totalUsers,
        pendingVerifications,
        totalPayments,
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        {loading && (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">Loading dashboard...</div>
        )}
        {!loading && error && <ErrorState title="Unable to load dashboard" message={error} onRetry={load} />}
        {!loading && !error && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Total Users" value={stats.totalUsers} />
              <Metric label="Pending Seller Verification" value={stats.pendingVerifications} />
              <Metric label="Payments (records)" value={stats.totalPayments} />
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3">Pending sellers</h2>
              <p className="text-sm text-gray-500 mb-3">
                New material listings go live as soon as a verified seller posts them; only seller accounts require document review.
              </p>
              {pendingSellers.length === 0 ? (
                <p className="text-sm text-gray-500">No pending seller verifications.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {pendingSellers.map((s) => (
                    <li key={s.sellerProfileId ?? s.id} className="flex justify-between gap-2">
                      <span className="text-gray-800">{s.companyName || s.CompanyName}</span>
                      <span className="text-gray-400">{s.city || s.City}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
