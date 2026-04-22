import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerLayout from '../../layouts/SellerLayout';
import StatusChip from '../../components/ui/StatusChip';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { getSellerOrders, applySellerOrderAction } from '../../api/orders.api';
import { getPagedItems } from '../../utils/pagedResponse';
import { formatRWF } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { 
  Eye, Check, X, Truck, Search, 
  ShoppingBag, Calendar, User, 
  ArrowRight, MoreVertical, Filter,
  TrendingUp, Clock, PackageCheck, MessageSquare, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';

const STATUS_TABS = [
  { label: 'All', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Accepted', value: 'Accepted' },
  { label: 'Shipping', value: 'Shipped' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancelled', value: 'Cancelled' },
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
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, tab, page]);

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
    } catch { toast.error('Action failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <SellerLayout>
      <div className="space-y-8 animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order <span className="text-gray-400">Stream</span></h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Manage your incoming sales and logistics</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative group">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-800"
              >
                Export <ChevronDown size={14} />
              </button>
              <div className="absolute right-0 mt-1 w-44 rounded-xl border border-gray-200 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible z-10">
                <button type="button" className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50" onClick={() => runExport('pdf')}>
                  Export as PDF
                </button>
                <button type="button" className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-50" onClick={() => runExport('excel')}>
                  Export as Excel
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl">
                <TrendingUp size={16} className="text-emerald-500" />
                <span className="text-xs font-black text-emerald-700">Live Updates Enabled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Status Tabs */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-4 shadow-sm overflow-hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {STATUS_TABS.map((t) => (
              <button key={t.value} onClick={() => { setTab(t.value); setPage(1); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  tab === t.value 
                    ? 'bg-gray-900 text-white shadow-xl scale-105' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                {tab === t.value && <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
           {loading ? (
             Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-40 bg-gray-50 border border-gray-100 animate-pulse rounded-[2.5rem]" />
             ))
           ) : orders.length === 0 ? (
             <div className="bg-white border border-gray-100 rounded-[3rem] p-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                   <ShoppingBag size={40} className="text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">Quiet in here...</h3>
                <p className="text-gray-300 text-sm mt-2">No orders match your current filter.</p>
             </div>
           ) : (
             orders.map((order) => (
               <div key={order.id} 
                 className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-6 lg:p-8 hover:shadow-2xl hover:shadow-gray-100 transition-all duration-500 overflow-hidden cursor-pointer"
                 onClick={() => navigate(`/seller/orders/${order.id}`)}>
                 
                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    {/* Left: Order High-level info */}
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-3xl flex flex-col items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                          <p className="text-[10px] font-black text-gray-400 uppercase">#ORD</p>
                          <p className="text-lg font-black text-gray-900 tracking-tighter">{order.id.toString().slice(-4)}</p>
                       </div>
                       
                       <div className="space-y-1">
                          <h3 className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors">{order.materialTitle}</h3>
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                             <div className="flex items-center gap-1.5">
                                <User size={12} className="text-gray-400" />
                                <span className="text-[11px] font-bold text-gray-500">{order.buyerCompany}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-gray-400" />
                                <span className="text-[11px] font-bold text-gray-500">{formatDate(order.createdAt)}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <Clock size={12} className="text-gray-400" />
                                <span className="text-[11px] font-bold text-gray-500">Updated {formatDate(order.updatedAt || order.createdAt)}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Middle: Stats */}
                    <div className="flex items-center gap-12 px-8 py-4 bg-gray-50/50 rounded-3xl border border-gray-50 group-hover:bg-white transition-colors">
                       <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</p>
                          <p className="text-sm font-black text-gray-900">{order.quantityOrdered} <span className="text-[11px] text-gray-400">{order.unit || 'Ton'}</span></p>
                       </div>
                       <div className="w-px h-8 bg-gray-200" />
                       <div className="space-y-0.5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue</p>
                          <p className="text-sm font-black text-gray-900">{formatRWF(order.totalAmount)}</p>
                       </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                       <StatusChip status={order.status} />
                       
                       <div className="flex items-center gap-2">
                          {order.status === 'Pending' && (
                             <>
                                <button onClick={(e) => { e.stopPropagation(); handleAction(order.id, 'Accepted'); }}
                                   className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-emerald-600 shadow-xl shadow-gray-200 transition-all active:scale-95">
                                   <Check size={14} /> Accept
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setRejectModal(order); }}
                                   className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                   <X size={18} />
                                </button>
                             </>
                          )}
                          
                          {order.status === 'Accepted' && (
                             <button onClick={(e) => { e.stopPropagation(); handleAction(order.id, 'Shipped'); }}
                                className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all active:scale-95">
                                <Truck size={14} /> Mark as Shipped
                             </button>
                          )}

                          <button onClick={() => navigate(`/seller/orders/${order.id}`)}
                             className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all">
                             <ArrowRight size={18} />
                          </button>
                       </div>
                    </div>
                 </div>
                 
                 {/* Decorative background element */}
                 <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-10 transition-opacity">
                    <PackageCheck size={120} strokeWidth={1} className="text-gray-900" />
                 </div>
               </div>
             ))
           )}
        </div>

        {/* Footer / Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-20">
           <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Showing <span className="text-gray-900">{orders.length}</span> of {totalCount} transactions
           </div>
           <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        {/* Reject Modal */}
        <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectNote(''); }} title="Decline Transaction" size="sm">
           <div className="space-y-6">
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex gap-3">
                 <X className="text-red-500 shrink-0" size={18} />
                 <p className="text-xs font-medium text-red-800 leading-relaxed">
                    Rejecting this order will notify the buyer and release the material stock back to your active inventory.
                 </p>
              </div>

              <div>
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 italic">Rejection Notes (Optional)</label>
                 <textarea 
                   value={rejectNote} 
                   onChange={(e) => setRejectNote(e.target.value)}
                   placeholder="e.g. Out of stock, pricing discrepancy..."
                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500/10 min-h-[100px]"
                 />
              </div>

              <div className="flex gap-3">
                 <button onClick={() => setRejectModal(null)}
                    className="flex-1 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider text-gray-400 hover:bg-gray-50 transition-all">
                    Cancel
                 </button>
                 <button 
                    disabled={submitting}
                    onClick={() => handleAction(rejectModal?.id, 'Rejected', rejectNote)}
                    className="flex-1 bg-red-500 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-red-600 shadow-xl shadow-red-100 transition-all active:scale-95 disabled:opacity-50">
                    {submitting ? 'Processing...' : 'Confirm Reject'}
                 </button>
              </div>
           </div>
        </Modal>

      </div>
    </SellerLayout>
  );
}
