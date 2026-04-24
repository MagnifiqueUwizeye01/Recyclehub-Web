import { useCallback, useEffect, useRef, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
import StatusChip from '../../components/ui/StatusChip';
import Pagination from '../../components/ui/Pagination';
import { createUser, deleteUser, getUserById, getUsers, updateUser, updateUserStatus } from '../../api/users.api';
import { formatDate } from '../../utils/formatDate';
import { getApiErrorMessage } from '../../utils/authMapper';
import { Search, User, ChevronDown, AlertTriangle, UserPlus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { sendMessage } from '../../api/messages.api';
import AdminMessageModal from '../../components/features/AdminMessageModal';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import { useAuth } from '../../hooks/useAuth';

const ROLE_STYLES = {
  Admin: 'bg-violet-50 text-violet-700 border-violet-100',
  Seller: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Buyer: 'bg-blue-50 text-blue-700 border-blue-100',
};

function mapUserFromApi(raw) {
  if (!raw) return null;
  return {
    userId: raw.userId ?? raw.UserId,
    username: raw.username ?? raw.Username,
    firstName: raw.firstName ?? raw.FirstName ?? '',
    lastName: raw.lastName ?? raw.LastName ?? '',
    email: raw.email ?? raw.Email,
    phoneNumber: raw.phoneNumber ?? raw.PhoneNumber ?? '',
    role: raw.role ?? raw.Role,
    status: raw.status ?? raw.Status,
    gender: raw.gender ?? raw.Gender ?? 'Male',
    createdAt: raw.createdAt ?? raw.CreatedAt,
  };
}

/** API may return status enum as string; normalize for UI logic. */
function isAccountActive(status) {
  const s = status == null ? '' : String(status).trim();
  if (!s) return false;
  if (/^active$/i.test(s)) return true;
  if (s === '0') return true;
  return false;
}

function ActionBtn({ children, onClick, variant = 'neutral', disabled, title }) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-40 disabled:pointer-events-none';
  const styles = {
    neutral:
      'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-300 px-2.5 py-1.5 min-h-[2rem]',
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 px-2.5 py-1.5 shadow-sm min-h-[2rem]',
    danger:
      'border border-amber-200/90 bg-white text-amber-800 hover:bg-amber-50 focus-visible:ring-amber-300 px-2.5 py-1.5 min-h-[2rem]',
    warn: 'rounded-lg border border-transparent text-amber-900/90 bg-amber-50/90 hover:bg-amber-100/90 px-2.5 py-1.5 min-h-[2rem]',
    iconDanger: 'rounded-lg border border-red-200/80 text-red-700 bg-white hover:bg-red-50 p-2 min-h-[2rem] min-w-[2rem]',
  };
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick} className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}

export default function UserManagementPage() {
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.userId ?? authUser?.id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [warnModal, setWarnModal] = useState({ open: false, user: null });
  const [exportOpen, setExportOpen] = useState(false);

  const [editUserId, setEditUserId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Buyer',
    gender: 'Male',
    phoneNumber: '',
    companyName: '',
    city: '',
    address: '',
    status: 'Active',
  });

  const prevDebouncedRef = useRef(debouncedSearch);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (prevDebouncedRef.current !== debouncedSearch) {
      prevDebouncedRef.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getUsers({
        pageNumber: page,
        pageSize: 15,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        searchTerm: debouncedSearch || undefined,
      });
      const pack = res.data;
      const arr = pack?.items ?? pack?.data ?? [];
      setUsers(Array.isArray(arr) ? arr : []);
      setTotalPages(pack?.totalPages ?? 1);
      setTotalCount(pack?.totalCount ?? arr.length);
    } catch {
      toast.error('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const runExport = (kind) => {
    setExportOpen(false);
    const cols = [
      { key: 'name', label: 'Name' },
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
      { key: 'joined', label: 'Joined Date' },
    ];
    const rows = users.map((u) => ({
      name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim(),
      username: u.username,
      email: u.email,
      role: u.role ?? u.Role,
      status: u.status ?? u.Status,
      joined: formatDate(u.createdAt),
    }));
    if (kind === 'pdf') exportToPDF('Users', cols, rows, 'users');
    else exportToExcel('Users', cols, rows, 'users');
  };

  const toggleActive = async (u) => {
    const id = u.userId ?? u.UserId ?? u.id;
    const active = isAccountActive(u.status ?? u.Status);
    if (!active) {
      /* activating */
    } else if (id === currentUserId) {
      toast.error('You cannot suspend your own account.');
      return;
    }
    try {
      await updateUserStatus(id, { isActive: !active });
      toast.success(!active ? 'User activated.' : 'User suspended.');
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Update failed.');
    }
  };

  const openEdit = async (id) => {
    setCreateOpen(false);
    try {
      const res = await getUserById(id);
      const body = res.data;
      const raw = body?.data ?? body;
      const m = mapUserFromApi(raw);
      if (!m) return;
      setForm({
        email: m.email || '',
        username: m.username || '',
        password: '',
        firstName: m.firstName || '',
        lastName: m.lastName || '',
        role: m.role || 'Buyer',
        gender: m.gender || 'Male',
        phoneNumber: m.phoneNumber || '',
        companyName: '',
        city: '',
        address: '',
        status: m.status || 'Active',
      });
      setEditUserId(id);
    } catch {
      toast.error('Could not load user.');
    }
  };

  const openCreate = () => {
    setEditUserId(null);
    setForm({
      email: '',
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'Buyer',
      gender: 'Male',
      phoneNumber: '',
      companyName: '',
      city: '',
      address: '',
      status: 'Active',
    });
    setCreateOpen(true);
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        gender: form.gender,
        phoneNumber: form.phoneNumber.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
      };
      await createUser(payload);
      toast.success('User created.');
      setCreateOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Create failed.');
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editUserId) return;
    if (editUserId === currentUserId && form.status === 'Suspended') {
      toast.error('You cannot suspend your own account.');
      return;
    }
    try {
      await updateUser(editUserId, {
        email: form.email.trim(),
        username: form.username.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: form.role,
        gender: form.gender,
        phoneNumber: form.phoneNumber.trim() || undefined,
        status: form.status,
      });
      toast.success('User updated.');
      setEditUserId(null);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Update failed.');
    }
  };

  const confirmDelete = async (u) => {
    const id = u.userId ?? u.UserId;
    if (id === currentUserId) {
      toast.error('You cannot delete your own account.');
      return;
    }
    const role = u.role ?? u.Role;
    if (role === 'Admin') {
      toast.error('Administrator accounts cannot be deleted here.');
      return;
    }
    if (!window.confirm(`Permanently delete ${u.username}? This cannot be undone.`)) return;
    try {
      await deleteUser(id);
      toast.success('User deleted.');
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Delete failed.');
    }
  };

  const needsCompanyFields = form.role === 'Buyer' || form.role === 'Seller';

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <ModernPageHeader
          title="User management"
          description="Directory of all platform accounts"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                <UserPlus size={18} />
                Add user
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setExportOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Export <ChevronDown size={16} />
                </button>
                {exportOpen && (
                  <>
                    <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Close menu" onClick={() => setExportOpen(false)} />
                    <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                      <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50" onClick={() => runExport('pdf')}>
                        Export as PDF
                      </button>
                      <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50" onClick={() => runExport('excel')}>
                        Export as Excel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          }
        />

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email…"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          >
            <option value="">All roles</option>
            <option value="Admin">Admin</option>
            <option value="Seller">Seller</option>
            <option value="Buyer">Buyer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
          <p className="hidden pb-2 text-xs text-gray-400 sm:block">Results update as you type</p>
        </div>
        </div>

        {loading ? (
          <PageLoadingCard message="Loading users…" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="p-3 font-medium">User</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Joined</th>
                  <th className="p-3 font-medium min-w-[220px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const id = u.userId ?? u.UserId;
                  const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.username;
                  const role = u.role ?? u.Role;
                  const status = u.status ?? u.Status;
                  const isSelf = id === currentUserId;
                  const isActive = isAccountActive(status);
                  return (
                    <tr key={id} className="border-b border-gray-50 hover:bg-gray-50/80">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                            {name[0]?.toUpperCase() || <User size={16} />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            <p className="text-xs text-gray-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className="p-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${ROLE_STYLES[role] || 'bg-gray-50'}`}>{role}</span>
                      </td>
                      <td className="p-3">
                        <StatusChip status={status} />
                      </td>
                      <td className="p-3 text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex flex-nowrap items-center justify-end gap-2 overflow-x-auto pb-0.5">
                          <ActionBtn
                            variant="warn"
                            disabled={isSelf}
                            title={isSelf ? 'You cannot send an admin notice to yourself' : 'Send admin notice'}
                            onClick={() =>
                              setWarnModal({
                                open: true,
                                user: { id, name: name || u.username, email: u.email },
                              })
                            }
                          >
                            <AlertTriangle size={14} strokeWidth={2.25} />
                            Warn
                          </ActionBtn>
                          <ActionBtn variant="neutral" onClick={() => openEdit(id)} title="Edit user">
                            <Pencil size={14} strokeWidth={2.25} />
                            Edit
                          </ActionBtn>
                          {!isSelf && role !== 'Admin' && (
                            <ActionBtn variant="iconDanger" onClick={() => confirmDelete(u)} title="Delete user">
                              <Trash2 size={14} strokeWidth={2.25} />
                            </ActionBtn>
                          )}
                          {!(isSelf && isActive) &&
                            (isActive ? (
                              <ActionBtn variant="danger" onClick={() => toggleActive(u)} title="Suspend this account">
                                Suspend
                              </ActionBtn>
                            ) : (
                              <ActionBtn
                                variant="primary"
                                onClick={() => toggleActive(u)}
                                title="Activate this account (pending or suspended)"
                              >
                                Activate
                              </ActionBtn>
                            ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && <div className="p-8 text-center text-sm text-gray-500">No users found.</div>}
            <div className="p-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <span>{totalCount} users</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>

      <AdminMessageModal
        isOpen={warnModal.open}
        onClose={() => setWarnModal({ open: false, user: null })}
        targetUser={{ name: warnModal.user?.name, email: warnModal.user?.email }}
        onSend={async (text) => {
          await sendMessage({
            receiverUserId: warnModal.user.id,
            messageText: text,
            messageType: 'AdminNotice',
          });
        }}
      />

      {(createOpen || editUserId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto" role="dialog" aria-modal="true">
          <form
            onSubmit={createOpen ? submitCreate : submitEdit}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 my-8 relative"
          >
            <button
              type="button"
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              onClick={() => {
                setCreateOpen(false);
                setEditUserId(null);
              }}
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 pr-8">{createOpen ? 'Add user' : 'Edit user'}</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <label className="block sm:col-span-2">
                <span className="text-gray-600 text-xs font-medium">Email</span>
                <input
                  required
                  type="email"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-gray-600 text-xs font-medium">Username</span>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
              </label>
              {createOpen && (
                <label className="block">
                  <span className="text-gray-600 text-xs font-medium">Password (min 8)</span>
                  <input
                    required
                    type="password"
                    minLength={8}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </label>
              )}
              <label className="block">
                <span className="text-gray-600 text-xs font-medium">First name</span>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-gray-600 text-xs font-medium">Last name</span>
                <input
                  required
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-gray-600 text-xs font-medium">Role</span>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Seller">Seller</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>
              <label className="block">
                <span className="text-gray-600 text-xs font-medium">Gender</span>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>
              {!createOpen && (
                <label className="block sm:col-span-2">
                  <span className="text-gray-600 text-xs font-medium">Status</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </label>
              )}
              <label className="block sm:col-span-2">
                <span className="text-gray-600 text-xs font-medium">Phone (optional)</span>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                />
              </label>
              {createOpen && needsCompanyFields && (
                <>
                  <label className="block sm:col-span-2">
                    <span className="text-gray-600 text-xs font-medium">Company name (optional)</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                      value={form.companyName}
                      onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-600 text-xs font-medium">City (optional)</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-600 text-xs font-medium">Address (optional)</span>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </label>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                onClick={() => {
                  setCreateOpen(false);
                  setEditUserId(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700">
                {createOpen ? 'Create user' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
