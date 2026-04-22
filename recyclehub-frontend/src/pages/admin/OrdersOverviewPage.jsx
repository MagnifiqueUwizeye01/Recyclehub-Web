import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import StatusChip from '../../components/ui/StatusChip';
import Pagination from '../../components/ui/Pagination';
import { getOrders } from '../../api/orders.api';
import { formatRWF } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { User, Building2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export default function OrdersOverviewPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getOrders({
          pageNumber: page,
          pageSize: 12,
          status: statusFilter || undefined,
        });
        const data = res.data;
        const rows = data?.items ?? data?.data ?? [];
        setOrders(Array.isArray(rows) ? rows : []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      } catch {
        toast.error('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, statusFilter]);

  const totalVolumeOnPage = orders.reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

  const runExport = (kind) => {
    const cols = [
      { key: 'orderId', label: 'Order #' },
      { key: 'date', label: 'Date' },
      { key: 'material', label: 'Material' },
      { key: 'seller', label: 'Seller' },
      { key: 'buyer', label: 'Buyer' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
    ];
    const rows = orders.map((o) => {
      const orderId = o.orderId ?? o.OrderId ?? o.id;
      const orderDate = o.orderDate ?? o.OrderDate ?? o.createdAt;
      const materialTitle = o.materialTitle ?? o.MaterialTitle ?? '—';
      const sellerLabel =
        o.sellerCompanyName ?? o.SellerCompanyName ?? o.sellerCompany ?? '—';
      const buyerLabel =
        o.buyerCompanyName ??
        o.BuyerCompanyName ??
        o.buyerFullName ??
        o.BuyerFullName ??
        o.buyerUsername ??
        o.BuyerUsername ??
        '—';
      return {
        orderId: String(orderId ?? ''),
        date: formatDate(orderDate),
        material: materialTitle,
        seller: sellerLabel,
        buyer: buyerLabel,
        amount: formatRWF(o.totalAmount),
        status: o.status ?? o.Status ?? '—',
      };
    });
    const title = statusFilter ? `Orders (${statusFilter || 'All'})` : 'Orders';
    if (kind === 'pdf') exportToPDF(title, cols, rows, 'admin-orders');
    else exportToExcel(title, cols, rows, 'admin-orders');
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review marketplace orders between buyers and sellers. Amounts below are for the current page only.
            </p>
          </div>
          {!loading && orders.length > 0 && (
            <div className="flex flex-wrap gap-2 shrink-0">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Orders (matching filters)</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{totalCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total amount (this page)</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">{formatRWF(totalVolumeOnPage)}</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(({ value, label }) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => {
                setStatusFilter(value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">Loading orders…</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-3 font-medium">Order</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Material</th>
                  <th className="p-3 font-medium">Seller</th>
                  <th className="p-3 font-medium">Buyer</th>
                  <th className="p-3 font-medium text-right">Amount</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((o, rowIndex) => {
                    const orderId = o.orderId ?? o.OrderId ?? o.id;
                    const orderDate = o.orderDate ?? o.OrderDate ?? o.createdAt;
                    const materialTitle = o.materialTitle ?? o.MaterialTitle ?? '—';
                    const sellerLabel =
                      o.sellerCompanyName ?? o.SellerCompanyName ?? o.sellerCompany ?? '—';
                    const buyerLabel =
                      o.buyerCompanyName ??
                      o.BuyerCompanyName ??
                      o.buyerFullName ??
                      o.BuyerFullName ??
                      o.buyerUsername ??
                      o.BuyerUsername ??
                      '—';
                    return (
                      <tr key={orderId ?? `order-row-${rowIndex}`} className="hover:bg-gray-50/80">
                        <td className="p-3">
                          <span className="font-medium text-gray-900">#{orderId}</span>
                        </td>
                        <td className="p-3 text-gray-600 whitespace-nowrap">{formatDate(orderDate)}</td>
                        <td className="p-3">
                          <div className="flex items-start gap-2 max-w-[14rem]">
                            <Package size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-gray-900 line-clamp-2">{materialTitle}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-gray-800">
                            <Building2 size={14} className="text-gray-400 shrink-0" />
                            <span className="line-clamp-2">{sellerLabel}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-gray-800">
                            <User size={14} className="text-gray-400 shrink-0" />
                            <span className="line-clamp-2">{buyerLabel}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="font-medium text-gray-900">{formatRWF(o.totalAmount)}</div>
                          <div className="text-xs text-gray-500">{o.quantityOrdered} {o.unit || o.Unit || 'units'}</div>
                        </td>
                        <td className="p-3">
                          <StatusChip status={o.status ?? o.Status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600">
            <p>
              Page <span className="font-medium text-gray-900">{page}</span> of{' '}
              <span className="font-medium text-gray-900">{totalPages}</span>
              <span className="text-gray-400"> · </span>
              {totalCount} order{totalCount !== 1 ? 's' : ''} total
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
