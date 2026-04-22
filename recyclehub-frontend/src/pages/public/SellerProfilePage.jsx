import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, Star, MessageSquare, Flag } from 'lucide-react';
import { getPublicSellerProfile } from '../../api/sellerProfiles.api';
import { getMaterialsBySellerUser } from '../../api/materials.api';
import { getSellerReviews } from '../../api/reviews.api';
import MaterialCard from '../../components/features/MaterialCard';
import ReviewCard from '../../components/features/ReviewCard';
import { useAuth } from '../../hooks/useAuth';
import ReportModal from '../../components/features/ReportModal';
import { resolveProfileImageUrl } from '../../utils/assetUrl';
import toast from 'react-hot-toast';

export default function SellerProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const uid = Number(userId);
    if (!Number.isFinite(uid)) return;
    (async () => {
      setLoading(true);
      try {
        const p = await getPublicSellerProfile(uid);
        setProfile(p);
        const [matRes, revRes] = await Promise.all([
          getMaterialsBySellerUser(uid, { page: 1, pageSize: 12, status: 'Available' }),
          getSellerReviews(uid, { page: 1, pageSize: 20 }),
        ]);
        setMaterials(matRes?.data?.data || []);
        const rawRev = revRes.data?.items ?? revRes.data?.data ?? revRes.data ?? [];
        setReviews(Array.isArray(rawRev) ? rawRev : []);
      } catch (e) {
        console.error(e);
        toast.error('Could not load seller profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const goRegister = () => {
    toast('Sign up to contact this seller', { icon: 'ℹ️' });
    navigate('/register', { state: { preselectedRole: 'Buyer' } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Seller not found.</p>
      </div>
    );
  }

  const uid = Number(userId);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-5xl mx-auto px-4">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden mt-8">
          <div className="h-40 bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-900" />
          <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <div className="flex gap-4 items-end">
              <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow flex items-center justify-center text-2xl font-bold text-emerald-800">
                {profile.profileImageUrl ? (
                  <img
                    src={resolveProfileImageUrl(profile.profileImageUrl) || profile.profileImageUrl}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  profile.companyName?.[0] || 'S'
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.companyName}</h1>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {profile.city}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                      <ShieldCheck size={12} /> Verified Seller
                    </span>
                  )}
                  <span className="text-xs text-gray-400">Member since {profile.memberSinceYear}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) goRegister();
                  else navigate('/messages', { state: { otherUserId: uid } });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
              >
                <MessageSquare size={16} /> Message Seller
              </button>
              <button
                type="button"
                title="Report"
                onClick={() => {
                  if (!isAuthenticated) goRegister();
                  else setReportOpen(true);
                }}
                className="p-2 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50"
              >
                <Flag size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-6 border-t border-gray-100 bg-gray-50/80">
            <Stat label="Listings" value={profile.totalListings} />
            <Stat label="Sales" value={profile.totalSales} />
            <Stat
              label="Rating"
              value={
                <span className="inline-flex items-center gap-1">
                  <Star size={14} className="text-amber-500" />
                  {(profile.averageRating ?? 0).toFixed?.(1) ?? profile.averageRating}
                </span>
              }
            />
            <Stat label="Response rate" value={profile.responseRatePercent != null ? `${profile.responseRatePercent}%` : '—'} />
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{profile.description || 'No description provided.'}</p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active listings from this seller</h2>
          {materials.length === 0 ? (
            <p className="text-sm text-gray-500">No active listings.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materials.map((m) => (
                <MaterialCard key={m.id} material={m} linkPrefix="/buyer/materials" />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificates</h2>
          {profile.certificates?.length ? (
            <ul className="space-y-2">
              {profile.certificates.map((c, i) => (
                <li key={i} className="text-sm border border-gray-100 rounded-xl px-4 py-3 bg-white">
                  <span className="font-medium text-gray-900">{c.certificateName}</span>
                  <span className="text-gray-500"> · {c.issuingAuthority}</span>
                  <span className="block text-xs text-gray-400 mt-1">
                    Issued {c.issueDate?.slice?.(0, 10) || c.issueDate}
                    {c.expiryDate ? ` · Expires ${c.expiryDate.slice?.(0, 10) || c.expiryDate}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No public certificates listed.</p>
          )}
        </section>

        <section className="mt-10 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What buyers say</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <ReviewCard key={r.reviewId ?? r.id} review={r} />
              ))}
            </div>
          )}
        </section>
      </div>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedUserId={uid}
        reportedUserName={profile.companyName}
        context="profile"
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="text-lg font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  );
}
