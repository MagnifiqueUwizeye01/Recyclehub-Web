import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import ModernPanel from '../../components/ui/ModernPanel';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import AdminStatStrip from '../../components/admin/AdminStatStrip';
import DistributionMosaic from '../../components/admin/DistributionMosaic';
import { getAllOrders } from '../../api/orders.api';
import { getAllPayments } from '../../api/payments.api';
import { formatRWF } from '../../utils/formatCurrency';
import { summarizePlatformAnalytics } from '../../utils/gemini';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { formatDate } from '../../utils/formatDate';

const SAMPLE_PAGE_SIZE = 500;

const ORDER_COLORS = {
  Pending: '#d97706',
  Accepted: '#059669',
  Cancelled: '#64748b',
  Delivered: '#047857',
  Shipped: '#2563eb',
  Paid: '#6d28d9',
  AwaitingPayment: '#dc2626',
};

const PAYMENT_COLORS = {
  Requested: '#0369a1',
  Failed: '#dc2626',
  Successful: '#059669',
  Completed: '#047857',
};

function countByKey(items, getKey) {
  const map = {};
  items.forEach((item) => {
    const k = getKey(item) || 'Unknown';
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function orderDateValue(o) {
  const raw = o.orderDate ?? o.OrderDate ?? o.createdAt ?? o.CreatedAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function PlatformAnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let ordersData = [];
    let paymentsData = [];
    try {
      try {
        const r = await getAllOrders({ pageNumber: 1, pageSize: SAMPLE_PAGE_SIZE });
        const pack = r.data;
        ordersData = pack?.items ?? pack?.data ?? [];
      } catch {
        ordersData = [];
      }
      try {
        const r = await getAllPayments({ pageNumber: 1, pageSize: SAMPLE_PAGE_SIZE });
        const pack = r.data;
        paymentsData = pack?.items ?? pack?.data ?? [];
      } catch {
        paymentsData = [];
      }
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredOrders = useMemo(() => {
    if (!dateFrom && !dateTo) return orders;
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    return orders.filter((o) => {
      const d = orderDateValue(o);
      if (!d) return true;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const filteredPayments = useMemo(() => {
    if (!dateFrom && !dateTo) return payments;
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    return payments.filter((p) => {
      const raw = p.requestedAt ?? p.RequestedAt ?? p.createdAt ?? p.CreatedAt;
      if (!raw) return true;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return true;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [payments, dateFrom, dateTo]);

  const orderStatusChart = useMemo(
    () => countByKey(filteredOrders, (o) => String(o.status ?? o.Status ?? 'Unknown')),
    [filteredOrders]
  );

  const paymentStatusChart = useMemo(
    () =>
      countByKey(filteredPayments, (p) =>
        String(p.paymentStatus ?? p.PaymentStatus ?? p.status ?? 'Unknown')
      ),
    [filteredPayments]
  );

  const successfulPayments = filteredPayments.filter((p) =>
    ['Successful', 'Completed'].includes(p.paymentStatus ?? p.status ?? p.PaymentStatus)
  );
  const revenue = successfulPayments.reduce((sum, p) => sum + Number(p.amount ?? p.Amount ?? 0), 0);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      setInsightLoading(true);
      setInsight(null);
      try {
        const text = await summarizePlatformAnalytics({
          orderCount: filteredOrders.length,
          successfulPaymentsCount: successfulPayments.length,
          revenueFormatted: formatRWF(revenue),
        });
        if (!cancelled) setInsight(text);
      } finally {
        if (!cancelled) setInsightLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, filteredOrders.length, successfulPayments.length, revenue]);

  const runExport = (kind) => {
    const cols = [
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
    ];
    const rows = [
      { metric: 'Orders (after date filter)', value: String(filteredOrders.length) },
      { metric: 'Successful payments', value: String(successfulPayments.length) },
      { metric: 'Revenue (RWF)', value: String(revenue) },
      ...(dateFrom ? [{ metric: 'Filter from', value: dateFrom }] : []),
      ...(dateTo ? [{ metric: 'Filter to', value: dateTo }] : []),
    ];
    orderStatusChart.forEach((r) => {
      rows.push({ metric: `Orders — ${r.name}`, value: String(r.count) });
    });
    paymentStatusChart.forEach((r) => {
      rows.push({ metric: `Payments — ${r.name}`, value: String(r.count) });
    });
    if (kind === 'pdf') exportToPDF('Platform analytics', cols, rows, 'platform-analytics');
    else exportToExcel('Platform analytics', cols, rows, 'platform-analytics');
  };

  return (
    <AdminLayout>
      <div className="w-full space-y-4">
        <ModernPageHeader
          title="Platform analytics"
          description={`Sample of up to ${SAMPLE_PAGE_SIZE} orders and payments. Apply date filters to narrow the view.`}
          actions={
            !loading ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => runExport('pdf')}
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => runExport('excel')}
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                >
                  Export Excel
                </button>
              </div>
            ) : null
          }
        />

        {!loading && (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wide text-gray-500">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wide text-gray-500">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              Clear filters
            </button>
          </div>
        )}

        {loading && <PageLoadingCard message="Loading analytics…" />}

        {!loading && (
          <>
            <AdminStatStrip
              items={[
                { label: 'Orders in sample', value: filteredOrders.length },
                { label: 'Successful payments', value: successfulPayments.length },
                { label: 'Revenue', value: formatRWF(revenue), hint: 'Settled only' },
              ]}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ModernPanel title="Orders by status" subtitle="Proportional tile view">
                <DistributionMosaic data={orderStatusChart} colorMap={ORDER_COLORS} />
              </ModernPanel>
              <ModernPanel title="Payments by status" subtitle="Proportional tile view">
                <DistributionMosaic data={paymentStatusChart} colorMap={PAYMENT_COLORS} />
              </ModernPanel>
            </div>

            <ModernPanel title="Sample orders" subtitle="First 15 rows from filtered sample">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      <th className="py-2 pr-4">Order</th>
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Material</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredOrders.slice(0, 15).map((o) => {
                      const id = o.orderId ?? o.OrderId ?? o.id;
                      const title = o.materialTitle ?? o.MaterialTitle ?? '—';
                      const st = o.status ?? o.Status ?? '—';
                      const amt = o.totalAmount ?? o.TotalAmount ?? 0;
                      const dt = orderDateValue(o);
                      return (
                        <tr key={id} className="text-gray-800">
                          <td className="py-1.5 pr-4 font-medium text-gray-900">#{id}</td>
                          <td className="py-1.5 pr-4 text-gray-600">{dt ? formatDate(dt.toISOString()) : '—'}</td>
                          <td className="max-w-[12rem] truncate py-1.5 pr-4">{title}</td>
                          <td className="py-1.5 pr-4">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
                              {st}
                            </span>
                          </td>
                          <td className="py-1.5 text-right tabular-nums">{formatRWF(amt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredOrders.length === 0 && (
                <p className="py-3 text-xs text-gray-500">No orders in this sample for the selected filters.</p>
              )}
              {filteredOrders.length > 15 && (
                <p className="mt-2 text-[11px] text-gray-400">
                  Showing 15 of {filteredOrders.length} loaded orders.
                </p>
              )}
            </ModernPanel>

            <ModernPanel title="Insight" subtitle="Optional Gemini summary">
              {insightLoading && <p className="text-xs text-gray-600">Generating insight…</p>}
              {!insightLoading && insight && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{insight}</p>
              )}
              {!insightLoading && !insight && !import.meta.env.VITE_GEMINI_API_KEY && (
                <p className="text-xs text-gray-500">
                  Set <code className="rounded bg-gray-100 px-1">VITE_GEMINI_API_KEY</code> to enable automated
                  summaries.
                </p>
              )}
              {!insightLoading && !insight && import.meta.env.VITE_GEMINI_API_KEY && (
                <p className="text-xs text-gray-500">Could not generate insight. Try again later.</p>
              )}
            </ModernPanel>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
