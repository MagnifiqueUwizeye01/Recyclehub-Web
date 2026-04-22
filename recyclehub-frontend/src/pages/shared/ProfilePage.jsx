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
import { Camera, Save, User, Building, Shield } from 'lucide-react';
import CertificateRequestModal from '../../components/features/CertificateRequestModal';
import BuyerLayout from '../../layouts/BuyerLayout';
import SellerLayout from '../../layouts/SellerLayout';
import AdminLayout from '../../layouts/AdminLayout';

export default function ProfilePage() {
  const { user: authUser, updateUser: syncAuthUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [roleProfile, setRoleProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({});
  const [roleForm, setRoleForm] = useState({});
  const [certificates, setCertificates] = useState([]);
  const [certModalOpen, setCertModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!authUser?.id && !authUser?.userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const userData = await getMe();
      setProfile(userData);
      syncAuthUser(userData);
      setForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        username: userData.username || '',
      });

      if (userData.role === 'Seller') {
        try {
          const spRes = await getMySellerProfile();
          const sp = unwrapApiPayload(spRes);
          setRoleProfile(sp);
          const uid = userData.userId ?? userData.id;
          try {
            const pub = await getPublicSellerProfile(uid);
            setCertificates(pub?.certificates || []);
          } catch {
            setCertificates([]);
          }
          setRoleForm({
            companyName: sp?.companyName || '',
            city: sp?.city || '',
            address: sp?.address || '',
            websiteUrl: sp?.websiteUrl || '',
            description: sp?.description || '',
          });
        } catch {
          setRoleProfile(null);
        }
      } else if (userData.role === 'Buyer') {
        try {
          const bpRes = await getMyBuyerProfile();
          const bp = unwrapApiPayload(bpRes);
          setRoleProfile(bp);
          setRoleForm({
            companyName: bp?.companyName || '',
            industryType: bp?.industryType || '',
            city: bp?.city || '',
            address: bp?.address || '',
            websiteUrl: bp?.websiteUrl || '',
          });
        } catch {
          setRoleProfile(null);
        }
      }
    } catch (err) {
      console.error('Profile load error:', err);
      setError('Failed to load profile. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [authUser?.id, authUser?.userId, syncAuthUser]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    const userId = profile?.userId || profile?.id;
    if (!userId) return;
    setSaving(true);
    try {
      await updateUser(userId, {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
      });
      if (profile?.role === 'Seller' && roleProfile) {
        await updateMySellerProfile(roleForm);
      } else if (profile?.role === 'Buyer' && roleProfile) {
        await updateMyBuyerProfile(roleForm);
      }
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
    const formData = new FormData();
    formData.append('file', file);
    try {
      const userId = profile?.userId || profile?.id;
      await uploadProfileImage(userId, formData);
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
    if (layoutRole === 'Buyer') return <BuyerLayout>{inner}</BuyerLayout>;
    if (layoutRole === 'Admin') return <AdminLayout>{inner}</AdminLayout>;
    return inner;
  };

  if (loading) {
    return wrap(
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return wrap(
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
          <User size={24} className="text-red-400" />
        </div>
        <p className="font-semibold text-gray-600 text-sm">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 bg-emerald-500 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-emerald-600 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  const initials = `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`.toUpperCase();

  const body = (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your personal and company information</p>
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Shield className="text-emerald-600 shrink-0 mt-0.5" size={18} aria-hidden />
          <div>
            <p className="text-sm font-semibold text-gray-900">Account security</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Turn on two-factor authentication in Settings so sign-in emails you a one-time code after your password.
            </p>
          </div>
        </div>
        <Link
          to="/settings"
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap shrink-0"
        >
          Open Settings →
        </Link>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {profile?.profileImageUrl ? (
              <img
                src={resolveProfileImageUrl(profile.profileImageUrl) || profile.profileImageUrl}
                alt="avatar"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
            )}
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center cursor-pointer hover:bg-emerald-600 transition-colors">
              <Camera size={14} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg">
              {profile?.firstName} {profile?.lastName}
            </p>
            <p className="text-sm text-gray-400">{profile?.email}</p>
            <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {profile?.role}
            </span>
            {profile?.role === 'Seller' && roleProfile?.verificationStatus && (
              <span className="inline-block mt-1 ml-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                {roleProfile.verificationStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <User size={15} className="text-emerald-500" /> Personal Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'firstName', label: 'First Name' },
            { key: 'lastName', label: 'Last Name' },
            { key: 'username', label: 'Username' },
            { key: 'phoneNumber', label: 'Phone Number' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.label}</label>
              <input
                value={form[f.key] || ''}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                disabled={f.key === 'username'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition-all disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
          <input
            value={profile?.email || ''}
            disabled
            className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support if needed.</p>
        </div>
      </div>

      {(profile?.role === 'Seller' || profile?.role === 'Buyer') && roleProfile && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Building size={15} className="text-emerald-500" /> Company Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'companyName', label: 'Company Name', full: true },
              ...(profile?.role === 'Buyer' ? [{ key: 'industryType', label: 'Industry Type', full: true }] : []),
              { key: 'city', label: 'City' },
              { key: 'address', label: 'Address' },
              { key: 'websiteUrl', label: 'Website (optional)', full: true },
              ...(profile?.role === 'Seller'
                ? [{ key: 'description', label: 'Description (optional)', full: true, area: true }]
                : []),
            ].map((f) => (
              <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.label}</label>
                {f.area ? (
                  <textarea
                    value={roleForm[f.key] || ''}
                    onChange={(e) => setRoleForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition-all"
                  />
                ) : (
                  <input
                    value={roleForm[f.key] || ''}
                    onChange={(e) => setRoleForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition-all"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {profile?.role === 'Seller' && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-800 text-sm">Current certificates</h2>
          {certificates.length === 0 ? (
            <p className="text-sm text-gray-500">No verified certificates on file yet.</p>
          ) : (
            <ul className="space-y-2">
              {certificates.map((c, i) => (
                <li key={i} className="text-sm border border-gray-100 rounded-xl px-3 py-2">
                  <span className="font-medium text-gray-900">{c.certificateName}</span>
                  <span className="text-gray-500 text-xs block mt-0.5">
                    Added {c.issueDate?.slice?.(0, 10) || c.issueDate || '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setCertModalOpen(true)}
            className="w-full py-2.5 rounded-xl border-2 border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50"
          >
            + Add New Certificate
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-sm"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…
          </>
        ) : (
          <>
            <Save size={16} /> Save Changes
          </>
        )}
      </button>
    </div>
  );

  return wrap(
    <>
      {body}
      <CertificateRequestModal
        isOpen={certModalOpen}
        onClose={() => {
          setCertModalOpen(false);
          load();
        }}
        sellerUserId={profile?.userId ?? profile?.id}
      />
    </>
  );
}
