import { useCallback, useEffect, useState } from 'react';
import { Users, ShieldCheck, CreditCard, Building2, RefreshCw } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import ErrorState from '../../components/ui/ErrorState';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import DashboardStatCard from '../../components/ui/DashboardStatCard';
import ModernPanel from '../../components/ui/ModernPanel';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
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
      <div className="w-full space-y-8">
        <ModernPageHeader
          title="Admin dashboard"
          description="Platform health, verifications, and payment activity at a glance."
          actions={
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-emerald-200 hover:bg-gray-50"
            >
              <RefreshCw size={16} className="text-gray-400" />
              Refresh
            </button>
          }
        />

        {loading && <PageLoadingCard message="Loading dashboard…" />}
        {!loading && error && <ErrorState title="Unable to load dashboard" message={error} onRetry={load} />}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DashboardStatCard
                icon={Users}
                label="Total users"
                value={stats.totalUsers.toLocaleString()}
                badge="Directory"
                tone="emerald"
              />
              <DashboardStatCard
                icon={ShieldCheck}
                label="Pending seller verification"
                value={stats.pendingVerifications.toLocaleString()}
                badge="Action queue"
                tone="amber"
              />
              <DashboardStatCard
                icon={CreditCard}
                label="Payment records"
                value={stats.totalPayments.toLocaleString()}
                badge="All time"
                tone="violet"
              />
            </div>

            <ModernPanel
              title="Pending sellers"
              subtitle="Seller accounts awaiting document review before full verification."
              headerRight={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                  <Building2 size={14} />
                  {stats.pendingVerifications} in queue
                </span>
              }
            >
              {pendingSellers.length === 0 ? (
                <p className="text-sm text-gray-500">No pending seller verifications.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                  {pendingSellers.map((s) => (
                    <li
                      key={s.sellerProfileId ?? s.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm first:rounded-t-xl last:rounded-b-xl hover:bg-gray-50/80"
                    >
                      <span className="font-medium text-gray-900">{s.companyName || s.CompanyName}</span>
                      <span className="shrink-0 text-gray-500">{s.city || s.City || '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </ModernPanel>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
