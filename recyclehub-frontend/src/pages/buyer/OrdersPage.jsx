import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BuyerLayout from '../../layouts/BuyerLayout';
import Table from '../../components/ui/Table';
import StatusChip from '../../components/ui/StatusChip';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';
import { formatRWF } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Eye, X, MessageSquare, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const TABS = ['All', 'Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrdersPage() {
  const { user } = useAuth();
  const { orders, loading, totalPages, fetchBuyerOrders, cancel } = useOrders();
  const [tab, setTab] = useState('All');
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();

  const runExport = (kind) => {
    const cols = [
      { key: 'id', label: 'Order #' },
      { key: 'materialTitle', label: 'Material' },
      { key: 'sellerCompany', label: 'Seller' },
      { key: 'quantityOrdered', label: 'Quantity' },
      { key: 'totalAmount', label: 'Amount (RWF)' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Date' },
    ];
    const rows = (orders || []).map((o) => ({
      id: o.id,
      materialTitle: o.materialTitle,
      sellerCompany: o.sellerCompany,
      quantityOrdered: `${o.quantityOrdered ?? ''} ${o.unit || ''}`.trim(),
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt ? formatDate(o.createdAt) : '',
    }));
    if (kind === 'pdf') exportToPDF('Purchase history', cols, rows, 'orders');
    else exportToExcel('Purchase history', cols, rows, 'orders');
  };

  useEffect(() => {
    if (!user) return;
    fetchBuyerOrders({ status: tab === 'All' ? undefined : tab, pageNumber: page, pageSize: 10 });
  }, [user, tab, page]);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await cancel(cancelId);
      setCancelId(null);
    } finally {
      setCancelling(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Order #', render: (v) => `#${v}` },
    { key: 'materialTitle', label: 'Material' },
    { key: 'sellerCompany', label: 'Seller' },
    { key: 'quantityOrdered', label: 'Qty', render: (v, row) => `${v} ${row.unit || ''}` },
    { key: 'totalAmount', label: 'Amount', render: (v) => formatRWF(v) },
    { key: 'status', label: 'Status', render: (v) => <StatusChip status={v} /> },
    { key: 'createdAt', label: 'Date', render: (v) => formatDate(v) },
    {
      key: 'actions', label: '', render: (_, row) => (
        <div className="flex gap-1.5">
          <Button size="xs" variant="ghost" icon={<Eye size={13} />} onClick={(e) => { e.stopPropagation(); navigate(`/buyer/orders/${row.id}`); }}>View</Button>
          <Button size="xs" variant="ghost" className="text-emerald-600" icon={<MessageSquare size={13} />} onClick={(e) => { 
            e.stopPropagation(); 
            navigate('/messages', { state: { otherUserId: row.sellerUserId, materialId: row.materialId, orderId: row.id } }); 
          }}>Chat</Button>
          {row.status === 'Pending' && (
            <Button size="xs" variant="danger" icon={<X size={13} />} onClick={(e) => { e.stopPropagation(); setCancelId(row.id); }}>Cancel</Button>
          )}
        </div>
      )
    },
  ];

  return (
    <BuyerLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-display font-bold text-hub-text">My Orders</h1>
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-hub-border bg-white px-4 py-2 text-sm font-medium text-hub-text hover:bg-hub-surface2"
            >
              Export <ChevronDown size={16} />
            </button>
            <div className="absolute right-0 mt-1 w-48 rounded-xl border border-hub-border bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible z-10">
              <button type="button" className="block w-full text-left px-4 py-2 text-sm hover:bg-hub-surface2" onClick={() => runExport('pdf')}>
                Export as PDF
              </button>
              <button type="button" className="block w-full text-left px-4 py-2 text-sm hover:bg-hub-surface2" onClick={() => runExport('excel')}>
                Export as Excel
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-body whitespace-nowrap transition-colors ${tab === t ? 'bg-hub-accent text-white' : 'text-hub-muted hover:text-hub-text hover:bg-hub-surface2'}`}>{t}</button>
          ))}
        </div>
        <Table columns={columns} data={orders} loading={loading} emptyMessage="No orders found" onRowClick={(r) => navigate(`/buyer/orders/${r.id}`)} />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        <ConfirmDialog isOpen={!!cancelId} onClose={() => setCancelId(null)} onConfirm={handleCancel} loading={cancelling}
          title="Cancel Order" message="Are you sure you want to cancel this order?" confirmText="Cancel Order" />
      </div>
    </BuyerLayout>
  );
}
