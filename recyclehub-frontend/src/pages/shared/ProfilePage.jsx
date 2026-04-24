import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getMe } from '../../api/auth.api';
import { updateUser, uploadProfileImage } from '../../api/users.api';
import { getMySellerProfile, updateMySellerProfile, getPublicSellerProfile } from '../../api/sellerProfiles.api';
import { getMyBuyerProfile, updateMyBuyerProfile } from '../../api/buyerProfiles.api';
import { unwrapApiPayload, getApiErrorMessage } from '../../utils/authMapper';
import { resolveProfileImageUrl } from '../../utils/assetUrl';
import toast from 'react-hot-toast';
import {
  Camera, Save, User, Building, Shield, Award,
  Plus, Mail, Phone, Globe, MapPin, CheckCircle,
} from 'lucide-react';
import CertificateRequestModal from '../../components/features/CertificateRequestModal';
import BuyerLayout from '../../layouts/BuyerLayout';
import SellerLayout from '../../layouts/SellerLayout';
import AdminLayout from '../../layouts/AdminLayout';

const ROLE_COLORS = {
  Admin:  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  Seller: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Buyer:  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
};

export default function ProfilePage() {
  const { user: authUser, updateUser: syncAuthUser } = useAuth();
  const [profile,       setProfile]       = useState(null);
  const [roleProfile,   setRoleProfile]   = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState(null);
  const [form,          setForm]          = useState({});
  const [roleForm,      setRoleForm]      = useState({});
  const [certificates,  setCertificates]  = useState([]);
  const [certModalOpen, setCertModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!authUser?.id && !authUser?.userId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const userData = await getMe();
      setProfile(userData);
      syncAuthUser(userData);
      setForm({
        firstName:   userData.firstName   || '',
        lastName:    userData.lastName    || '',
        phoneNumber: userData.phoneNumber || '',
        username:    userData.username    || '',
      });
      if (userData.role === 'Seller') {
        try {
          const sp = unwrapApiPayload(await getMySellerProfile());
          setRoleProfile(sp);
          try { const pub = await getPublicSellerProfile(userData.userId ?? userData.id); setCertificates(pub?.certificates || []); }
          catch { setCertificates([]); }
          setRoleForm({ companyName: sp?.companyName || '', city: sp?.city || '', address: sp?.address || '', websiteUrl: sp?.websiteUrl || '', description: sp?.description || '' });
        } catch { setRoleProfile(null); }
      } else if (userData.role === 'Buyer') {
        try {
          const bp = unwrapApiPayload(await getMyBuyerProfile());
          setRoleProfile(bp);
          setRoleForm({ companyName: bp?.companyName || '', industryType: bp?.industryType || '', city: bp?.city || '', address: bp?.address || '', websiteUrl: bp?.websiteUrl || '' });
        } catch { setRoleProfile(null); }
      }
    } catch (err) {
      console.error('Profile load error:', err);
      setError('Failed to load profile. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [authUser?.id, authUser?.userId, syncAuthUser]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    const userId = profile?.userId || profile?.id;
    if (!userId) return;
    setSaving(true);
    try {
      await updateUser(userId, { firstName: form.firstName, lastName: form.lastName, phoneNumber: form.phoneNumber });
      if (profile?.role === 'Seller' && roleProfile) await updateMySellerProfile(roleForm);
      else if (profile?.role === 'Buyer' && roleProfile) await updateMyBuyerProfile(roleForm);
      const next = await getMe();
      setProfile(next);
      syncAuthUser(next);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const userId = profile?.userId || profile?.id;
      await uploadProfileImage(userId, fd);
      const next = await getMe();
      setProfile(next);
      syncAuthUser(next);
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Failed to upload photo.');
    }
  };

  const layoutRole = profile?.role ?? authUser?.role;
  const wrap = (inner) => {
    if (layoutRole === 'Seller') return <SellerLayout>{inner}</SellerLayout>;
    if (layoutRole === 'Buyer')  return <BuyerLayout>{inner}</BuyerLayout>;
    if (layoutRole === 'Admin')  return <AdminLayout>{inner}</AdminLayout>;
    return inner;
  };

  if (loading) return wrap(
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
        <p className="text-sm text-gray-500">Loading profile…</p>
      </div>
    </div>
  );

  if (error) return wrap(
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <User size={24} className="text-red-400" />
      </div>
      <p className="text-sm font-semibold text-gray-600">{error}</p>
      <button type="button" onClick={() => window.location.reload()}
        className="mt-4 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600">
        Refresh Page
      </button>
    </div>
  );

  const initials = `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`.toUpperCase();
  const roleColor = ROLE_COLORS[profile?.role] || ROLE_COLORS.Buyer;

  const body = (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* page title */}
      <div className="mb-2">
        <h1 className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your personal and company information</p>
      </div>

      {/* security hint */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <Shield size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Account security</p>
            <p className="mt-0.5 text-xs text-gray-600">
              Enable two-factor authentication so each sign-in requires a one-time email code.
            </p>
          </div>
        </div>
        <Link to="/settings" className="shrink-0 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
          Open settings →
        </Link>
      </div>

      {/* avatar card */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="relative">
              {profile?.profileImageUrl ? (
                <img src={resolveProfileImageUrl(profile.profileImageUrl) || profile.profileImageUrl} alt="avatar"
                  className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-sm" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
                  <span className="text-2xl font-bold text-white">{initials || '?'}</span>
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-xl bg-emerald-500 shadow-sm transition-colors hover:bg-emerald-600">
                <Camera size={13} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div className="mb-1 flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${roleColor.bg} ${roleColor.text} ${roleColor.border}`}>
                <Shield size={11} />{profile?.role}
              </span>
              {profile?.role === 'Seller' && roleProfile?.verificationStatus && (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${roleProfile.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  <CheckCircle size={11} />{roleProfile.verificationStatus}
                </span>
              )}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-gray-900">{profile?.firstName} {profile?.lastName}</p>
            <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Mail size={12} />{profile?.email}</span>
              {form.phoneNumber && <span className="flex items-center gap-1"><Phone size={12} />{form.phoneNumber}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* personal info */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
          <User size={15} className="text-emerald-500" /> Personal Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'firstName',   label: 'First Name' },
            { key: 'lastName',    label: 'Last Name' },
            { key: 'username',    label: 'Username' },
            { key: 'phoneNumber', label: 'Phone Number' },
          ].map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">{f.label}</label>
              <input
                value={form[f.key] || ''}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                disabled={f.key === 'username'}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-gray-500">Email Address</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={profile?.email || ''} disabled
              className="w-full cursor-not-allowed rounded-xl border border-gray-100 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-400" />
          </div>
          <p className="mt-1 text-xs text-gray-400">Email cannot be changed. Contact support if needed.</p>
        </div>
      </div>

      {/* company info */}
      {(profile?.role === 'Seller' || profile?.role === 'Buyer') && roleProfile && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
            <Building size={15} className="text-emerald-500" /> Company Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'companyName',  label: 'Company Name',    full: true },
              ...(profile?.role === 'Buyer' ? [{ key: 'industryType', label: 'Industry Type', full: true }] : []),
              { key: 'city',         label: 'City',             icon: MapPin },
              { key: 'address',      label: 'Address',          icon: MapPin },
              { key: 'websiteUrl',   label: 'Website (optional)', full: true, icon: Globe },
              ...(profile?.role === 'Seller' ? [{ key: 'description', label: 'Description (optional)', full: true, area: true }] : []),
            ].map((f) => (
              <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">{f.label}</label>
                {f.area ? (
                  <textarea rows={3} value={roleForm[f.key] || ''} onChange={(e) => setRoleForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                ) : (
                  <div className="relative">
                    {f.icon && <f.icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
                    <input value={roleForm[f.key] || ''} onChange={(e) => setRoleForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      className={`w-full rounded-xl border border-gray-200 py-2.5 text-sm text-gray-800 transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 ${f.icon ? 'pl-9 pr-3' : 'px-3'}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* certificates */}
      {profile?.role === 'Seller' && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-800">
            <Award size={15} className="text-emerald-500" /> Certificates
          </h2>
          {certificates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
              <Award size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">No verified certificates on file yet.</p>
            </div>
          ) : (
            <ul className="mb-4 space-y-2">
              {certificates.map((c, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-gray-100 px-3 py-2.5 transition-colors hover:bg-gray-50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                    <Award size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.certificateName}</p>
                    <p className="text-xs text-gray-500">Issued {c.issueDate?.slice?.(0, 10) || c.issueDate || '—'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setCertModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-500 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50">
            <Plus size={16} /> Add New Certificate
          </button>
        </div>
      )}

      {/* save */}
      <button type="button" onClick={handleSave} disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-60">
        {saving ? (
          <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving…</>
        ) : (
          <><Save size={16} /> Save Changes</>
        )}
      </button>
    </div>
  );

  return wrap(
    <>
      {body}
      <CertificateRequestModal
        isOpen={certModalOpen}
        onClose={() => { setCertModalOpen(false); load(); }}
        sellerUserId={profile?.userId ?? profile?.id}
      />
    </>
  );
}
