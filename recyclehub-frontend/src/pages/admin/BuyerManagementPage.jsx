import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import StatusChip from '../../components/ui/StatusChip';
import Pagination from '../../components/ui/Pagination';
import { getUsers, updateUserStatus } from '../../api/users.api';
import { formatDate } from '../../utils/formatDate';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BuyerManagementPage() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async (pageNum = page) => {
    try {
      setLoading(true);
      const res = await getUsers({
        role: 'Buyer',
        pageNumber: pageNum,
        pageSize: 15,
        searchTerm: searchQuery || undefined,
      });
      const pack = res.data;
      const arr = pack?.items ?? pack?.data ?? [];
      setBuyers(Array.isArray(arr) ? arr : []);
      setTotalPages(pack?.totalPages ?? 1);
      setTotalCount(pack?.totalCount ?? arr.length);
    } catch {
      toast.error('Failed to load buyers. Please try again.');
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1);
  };

  const toggle = async (u) => {
    const id = u.userId ?? u.UserId;
    const active = (u.status ?? u.Status) === 'Active';
    try {
      await updateUserStatus(id, { isActive: !active });
      toast.success(!active ? 'Buyer activated.' : 'Buyer suspended.');
      load();
    } catch {
      toast.error('Update failed.');
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <ModernPageHeader
          title="Buyers"
          description="Buyer accounts and company profiles. Search and manage access."
        />

        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buyers…"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <button type="submit" className="rounded-xl bg-emerald-500 text-white px-5 py-2.5 text-sm font-medium">
            Search
          </button>
        </form>

        {loading ? (
          <PageLoadingCard message="Loading buyers…" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Joined</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((u) => {
                  const id = u.userId ?? u.UserId;
                  const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.username;
                  const status = u.status ?? u.Status;
                  return (
                    <tr key={id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{name}</td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className="p-3">
                        <StatusChip status={status} />
                      </td>
                      <td className="p-3 text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => toggle(u)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${
                            status === 'Active'
                              ? 'border border-amber-200 text-amber-700'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {buyers.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">No buyers found.</div>
            )}
            <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <span>{totalCount} buyers</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
