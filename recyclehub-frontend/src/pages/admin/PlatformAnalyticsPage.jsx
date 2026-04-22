import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { getAllOrders } from '../../api/orders.api';
import { getAllPayments } from '../../api/payments.api';
import { formatRWF } from '../../utils/formatCurrency';
import { summarizePlatformAnalytics } from '../../utils/gemini';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { formatDate } from '../../utils/formatDate';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const SAMPLE_PAGE_SIZE = 500;

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
    const okPay = successfulPayments;
    const rev = revenue;
    let cancelled = false;
    (async () => {
      setInsightLoading(true);
      setInsight(null);
      try {
        const text = await summarizePlatformAnalytics({
          orderCount: filteredOrders.length,
          successfulPaymentsCount: okPay.length,
          revenueFormatted: formatRWF(rev),
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Platform analytics</h1>
          {!loading && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => runExport('pdf')}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Export PDF
              </button>
              <button
                type="button"
                onClick={() => runExport('excel')}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
              >
                Export Excel
              </button>
            </div>
          )}
        </div>

        {!loading && (
          <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div>
              <label className="block text-xs font-medium text-gray-500">From date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">To date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear filters
            </button>
            <p className="text-xs text-gray-500 sm:ml-auto max-w-md">
              Filters apply to the loaded sample (up to {SAMPLE_PAGE_SIZE} orders / payments). Charts and totals update
              accordingly.
            </p>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">Loading analytics...</div>
        )}
        {!loading && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Orders (filtered sample)" value={filteredOrders.length} />
              <Metric label="Successful payments (filtered)" value={successfulPayments.length} />
              <Metric label="Revenue (filtered)" value={formatRWF(revenue)} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Orders by status</h2>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={orderStatusChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Orders" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Payments by status</h2>
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentStatusChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Payments" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm overflow-x-auto">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Sample orders (table)</h2>
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
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
                      <tr key={id}>
                        <td className="py-2 pr-4 font-medium text-gray-900">#{id}</td>
                        <td className="py-2 pr-4 text-gray-600">{dt ? formatDate(dt.toISOString()) : '—'}</td>
                        <td className="py-2 pr-4 text-gray-800 max-w-[12rem] truncate">{title}</td>
                        <td className="py-2 pr-4">{st}</td>
                        <td className="py-2 text-right">{formatRWF(amt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <p className="text-sm text-gray-500 py-4">No orders in this sample for the selected filters.</p>
              )}
              {filteredOrders.length > 15 && (
                <p className="text-xs text-gray-400 mt-2">Showing 15 of {filteredOrders.length} loaded orders.</p>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">Insight (Gemini)</h2>
              <p className="mt-1 text-xs text-gray-500">
                Optional summary. Set <code className="rounded bg-gray-100 px-1">VITE_GEMINI_API_KEY</code> in your frontend env
                to enable.
              </p>
              {insightLoading && <p className="mt-3 text-sm text-gray-600">Generating insight…</p>}
              {!insightLoading && insight && <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{insight}</p>}
              {!insightLoading && !insight && !import.meta.env.VITE_GEMINI_API_KEY && (
                <p className="mt-3 text-sm text-amber-800/90">Add a Gemini API key to see an automated narrative here.</p>
              )}
              {!insightLoading && !insight && import.meta.env.VITE_GEMINI_API_KEY && (
                <p className="mt-3 text-sm text-gray-500">Could not generate insight. Try again later.</p>
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
