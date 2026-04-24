import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerLayout from '../../layouts/SellerLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import StatusChip from '../../components/ui/StatusChip';
import Table from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { getSellerOrders, applySellerOrderAction } from '../../api/orders.api';
import { getPagedItems } from '../../utils/pagedResponse';
import { formatRWF } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Eye, Check, X, Truck, ChevronDown, Clock, Package, CheckCircle, XCircle, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const STATUS_TABS = [
  { label: 'All',       value: 'All',       icon: Activity },
  { label: 'Pending',   value: 'Pending',   icon: Clock },
  { label: 'Accepted',  value: 'Accepted',  icon: Package },
  { label: 'Shipping',  value: 'Shipped',   icon: Truck },
  { label: 'Delivered', value: 'Delivered', icon: CheckCircle },
  { label: 'Cancelled', value: 'Cancelled', icon: XCircle },
];

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await getSellerOrders({
        status: tab === 'All' ? undefined : tab,
        pageNumber: page,
        pageSize: 10,
      });
      const { items, totalPages: tp, totalCount: tc } = getPagedItems(res);
      setOrders(items.map((o) => ({ ...o, id: o.orderId ?? o.id })));
      setTotalPages(tp || 1);
      setTotalCount(tc || 0);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user, tab, page]);

  const runExport = (kind) => {
    const cols = [
      { key: 'id', label: 'Order #' },
      { key: 'materialTitle', label: 'Material' },
      { key: 'buyerCompany', label: 'Buyer Company' },
      { key: 'quantityOrdered', label: 'Quantity' },
      { key: 'totalAmount', label: 'Amount (RWF)' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Date' },
    ];
    const rows = (orders || []).map((o) => ({
      id: o.id,
      materialTitle: o.materialTitle,
      buyerCompany: o.buyerCompany ?? o.buyerCompanyName,
      quantityOrdered: `${o.quantityOrdered ?? ''} ${o.unit || ''}`.trim(),
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt ? formatDate(o.createdAt) : '',
    }));
    if (kind === 'pdf') exportToPDF('Seller orders', cols, rows, 'seller-orders');
    else exportToExcel('Seller orders', cols, rows, 'seller-orders');
  };

  const handleAction = async (orderId, status, sellerNote) => {
    try {
      setSubmitting(true);
      await applySellerOrderAction(orderId, status, sellerNote);
      toast.success(`Order marked as ${status}`);
      load();
      setRejectModal(null);
      setRejectNote('');
    } catch {
      toast.error('Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Order #', render: (v) => `#${v}` },
    { key: 'materialTitle', label: 'Material' },
    {
      key: 'buyerCompany',
      label: 'Buyer',
      render: (_, row) => row.buyerCompany ?? row.buyerCompanyName ?? '—',
    },
    { key: 'quantityOrdered', label: 'Qty', render: (v, row) => `${v ?? ''} ${row.unit || ''}`.trim() },
    { key: 'totalAmount', label: 'Amount', render: (v) => formatRWF(v) },
    { key: 'status', label: 'Status', render: (v) => <StatusChip status={v} /> },
    { key: 'createdAt', label: 'Date', render: (v) => formatDate(v) },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button size="xs" variant="ghost" icon={<Eye size={13} />} onClick={() => navigate(`/seller/orders/${row.id}`)}>
            View
          </Button>
          {row.status === 'Pending' && (
            <>
              <Button size="xs" variant="ghost" className="text-emerald-600" icon={<Check size={13} />} onClick={() => handleAction(row.id, 'Accepted')}>
                Accept
              </Button>
              <Button size="xs" variant="danger" icon={<X size={13} />} onClick={() => setRejectModal(row)}>
                Decline
              </Button>
            </>
          )}
          {row.status === 'Accepted' && (
            <Button size="xs" variant="ghost" className="text-emerald-600" icon={<Truck size={13} />} onClick={() => handleAction(row.id, 'Shipped')}>
              Shipped
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <SellerLayout>
      <div className="w-full animate-fade-in space-y-8">
        <ModernPageHeader
          title="Orders"
          description="Fulfill buyer requests, ship when paid, and track every sale."
          actions={
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-200 hover:bg-gray-50"
              >
                Export <ChevronDown size={16} />
              </button>
              <div className="invisible absolute right-0 z-10 mt-1 w-48 rounded-xl border border-gray-200 bg-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => runExport('pdf')}
                >
                  Export as PDF
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                  onClick={() => runExport('excel')}
                >
                  Export as Excel
                </button>
              </div>
            </div>
          }
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setTab(t.value);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                tab === t.value ? 'bg-emerald-600 text-white shadow-md' : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              {t.icon && <t.icon size={14} />}{t.label}
            </button>
          ))}
        </div>

        <Table
          columns={columns}
          data={orders}
          loading={loading}
          emptyMessage="No orders found"
          onRowClick={(r) => navigate(`/seller/orders/${r.id}`)}
        />

        <div className="flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {orders.length} of {totalCount} orders
          </span>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectNote(''); }} title="Decline order" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">The buyer will be notified and stock will return to your inventory where applicable.</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Note (optional)</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="min-h-[88px] w-full rounded-xl border border-gray-200 p-3 text-sm"
                placeholder="Reason for declining…"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setRejectModal(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                loading={submitting}
                onClick={() => handleAction(rejectModal?.id, 'Rejected', rejectNote)}
              >
                Decline order
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </SellerLayout>
  );
}
