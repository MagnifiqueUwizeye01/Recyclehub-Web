import { useCallback, useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import ErrorState from '../../components/ui/ErrorState';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import ModernPanel from '../../components/ui/ModernPanel';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import { getAllPayments } from '../../api/payments.api';
import { formatRWF } from '../../utils/formatCurrency';

export default function PaymentsOverviewPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllPayments({ page: 1, pageSize: 30 });
      const body = res?.data;
      const rows = body?.items ?? body?.data ?? [];
      setPayments(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error(err);
      setError('Failed to load payments. Please try again.');
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
          title="Payments overview"
          description="Recent mobile money and checkout records across the marketplace."
        />
        {loading && <PageLoadingCard message="Loading payments…" />}
        {!loading && error && <ErrorState title="Unable to load payments" message={error} onRetry={load} />}
        {!loading && !error && (
          <ModernPanel
            title="Recent payments"
            subtitle={`${payments.length} record${payments.length !== 1 ? 's' : ''} loaded`}
            headerRight={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                <CreditCard size={14} />
                Live feed
              </span>
            }
          >
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments found.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                {payments.map((payment) => (
                  <li
                    key={payment.paymentId ?? payment.id}
                    className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">Payment #{payment.paymentId ?? payment.id}</p>
                      <p className="text-xs text-gray-500">{payment.phoneNumber || 'No phone number provided'}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-gray-900">{formatRWF(payment.amount || 0)}</p>
                      <p className="text-xs font-medium text-emerald-700">
                        {payment.paymentStatus ?? payment.status ?? 'Pending'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ModernPanel>
        )}
      </div>
    </AdminLayout>
  );
}
