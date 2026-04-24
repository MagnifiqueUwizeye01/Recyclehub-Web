import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BuyerLayout from '../../layouts/BuyerLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import Table from '../../components/ui/Table';
import StatusChip from '../../components/ui/StatusChip';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { useOrders } from '../../hooks/useOrders';
import { formatRWF } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Eye, X, MessageSquare, ChevronDown, Package, Clock, Truck, CheckCircle, XCircle, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const TABS = [
  { value: 'All',       label: 'All',       icon: Activity },
  { value: 'Pending',   label: 'Pending',   icon: Clock },
  { value: 'Accepted',  label: 'Accepted',  icon: Package },
  { value: 'Shipped',   label: 'Shipped',   icon: Truck },
  { value: 'Delivered', label: 'Delivered', icon: CheckCircle },
  { value: 'Cancelled', label: 'Cancelled', icon: XCircle },
];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="w-full animate-fade-in space-y-8">
        <ModernPageHeader
          title="My orders"
          description="Track purchases, message sellers, or cancel while still pending."
          actions={
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-emerald-200 hover:bg-gray-50"
              >
                Export <ChevronDown size={16} />
              </button>
              <div className="invisible absolute right-0 z-10 mt-1 w-48 rounded-xl border border-gray-200 bg-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50" onClick={() => runExport('pdf')}>
                  Export as PDF
                </button>
                <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50" onClick={() => runExport('excel')}>
                  Export as Excel
                </button>
              </div>
            </div>
          }
        />
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" onClick={() => { setTab(value); setPage(1); }}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                tab === value ? 'bg-emerald-600 text-white shadow-md' : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <Icon size={14} />{label}
            </button>
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
