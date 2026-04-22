import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ErrorState from '../../components/ui/ErrorState';
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
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Payments Overview</h1>
        {loading && <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">Loading payments...</div>}
        {!loading && error && <ErrorState title="Unable to Load Payments" message={error} onRetry={load} />}
        {!loading && !error && (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.paymentId ?? payment.id} className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <p className="font-medium text-gray-900">Payment #{payment.paymentId ?? payment.id}</p>
                <p className="text-sm text-gray-600">{formatRWF(payment.amount || 0)} - {payment.paymentStatus ?? payment.status ?? 'Pending'}</p>
                <p className="text-xs text-gray-500">{payment.phoneNumber || 'No phone number provided'}</p>
              </div>
            ))}
            {payments.length === 0 && <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">No payments found.</div>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
