import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerLayout from '../../layouts/SellerLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import StatusChip from '../../components/ui/StatusChip';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { getSellerMaterials, deleteMaterial } from '../../api/materials.api';
import { normalizeMaterial } from '../../utils/materialMapper';
import { formatRWF } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Plus, Pencil, Trash2, Search, Package, Activity, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const TABS = [
  { label: 'All',            value: 'All',       icon: Activity },
  { label: 'Pending review', value: 'Pending',   icon: Clock },
  { label: 'Available',      value: 'Available', icon: CheckCircle },
  { label: 'Sold',           value: 'Sold',      icon: Package },
];

export default function InventoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');

  const load = async (overrides = {}) => {
    if (!user) return;
    const effectiveTab = overrides.tab ?? tab;
    const effectivePage = overrides.page ?? page;
    const effectiveSearch = overrides.search !== undefined ? overrides.search : search;
    try {
      setLoading(true);
      const res = await getSellerMaterials({
        status: effectiveTab === 'All' ? undefined : effectiveTab,
        pageNumber: effectivePage,
        pageSize: PAGE_SIZE,
        searchTerm: effectiveSearch || undefined,
      });
      const body = res.data;
      const raw = body?.items ?? body?.data ?? [];
      const rows = Array.isArray(raw) ? raw.map((m) => normalizeMaterial(m)).filter(Boolean) : [];
      setMaterials(rows);
      setTotalPages(body?.totalPages || 1);
      setTotalCount(body?.totalCount ?? rows.length);
    } catch {
      toast.error('Failed to load your listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user, tab, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load({ page: 1, search });
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteMaterial(deleteId);
      toast.success('Listing removed.');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Could not delete listing.');
    } finally {
      setDeleting(false);
    }
  };

  const from = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-6xl space-y-8 pb-12">
        <ModernPageHeader
          title="My listings"
          description="Manage materials you sell on RecycleHub. New listings appear on the buyer marketplace as soon as you publish them."
          actions={
            <button
              type="button"
              onClick={() => navigate('/seller/materials/add')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus size={18} />
              Add listing
            </button>
          }
        />
        <p className="-mt-2 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{totalCount}</span> listing{totalCount !== 1 ? 's' : ''} total
        </p>

        <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setTab(t.value);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    tab === t.value ? 'bg-emerald-600 text-white shadow-md' : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {t.icon && <t.icon size={14} />}{t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="flex w-full lg:max-w-sm gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title or city…"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Search
              </button>
            </form>
          </div>

          {loading ? (
            <PageLoadingCard message="Loading listings…" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-gray-600">
                    <th className="p-3 font-medium">Material</th>
                    <th className="p-3 font-medium">Quantity</th>
                    <th className="p-3 font-medium">Price</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Views</th>
                    <th className="p-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-gray-500">
                        <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-700">No materials in this view.</p>
                        <p className="mt-1 text-sm">
                          {tab === 'All'
                            ? 'Add a material to start selling on the marketplace.'
                            : 'Try another filter or clear search.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    materials.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/80">
                        <td className="p-3 align-top">
                          <p className="font-medium text-gray-900 line-clamp-2">{m.title}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {[m.materialType, m.city].filter(Boolean).join(' · ') || '—'}
                          </p>
                          {m.createdAt && (
                            <p className="mt-0.5 text-xs text-gray-400">Added {formatDate(m.createdAt)}</p>
                          )}
                        </td>
                        <td className="p-3 text-gray-800 whitespace-nowrap">
                          {m.quantity} {m.unit}
                          <div className="text-xs text-gray-500">Min. order {m.minOrderQty}</div>
                        </td>
                        <td className="p-3 text-gray-900 whitespace-nowrap">{formatRWF(m.unitPrice)}</td>
                        <td className="p-3">
                          <StatusChip status={m.status} />
                        </td>
                        <td className="p-3 text-gray-600">{m.viewCount ?? 0}</td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/seller/materials/${m.id}/edit`)}
                              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-emerald-700"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(m.id)}
                              className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && totalCount > 0 && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
            <p>
              Showing <span className="font-medium text-gray-900">{from}</span>–
              <span className="font-medium text-gray-900">{to}</span> of{' '}
              <span className="font-medium text-gray-900">{totalCount}</span> materials
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          loading={deleting}
          title="Delete this listing?"
          message="This removes the material from the marketplace. You can add it again later."
          confirmText="Delete listing"
        />
      </div>
    </SellerLayout>
  );
}
