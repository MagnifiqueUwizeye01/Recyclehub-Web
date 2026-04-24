import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, Star, MessageSquare, Flag } from 'lucide-react';
import { getPublicSellerProfile } from '../../api/sellerProfiles.api';
import { getMaterialsBySellerUser } from '../../api/materials.api';
import { getSellerReviews } from '../../api/reviews.api';
import MaterialCard from '../../components/features/MaterialCard';
import ReviewCard from '../../components/features/ReviewCard';
import PageBackButton from '../../components/ui/PageBackButton';
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Seller not found.</p>
      </div>
    );
  }

  const uid = Number(userId);

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="mb-5">
          <PageBackButton fallback="/" label="Browse listings" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-900 sm:h-32" />

          <div className="border-b border-gray-100 px-5 pb-5 pt-5 sm:px-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-white text-2xl font-bold text-emerald-800 shadow-md ring-1 ring-gray-100">
                  {profile.profileImageUrl ? (
                    <img
                      src={resolveProfileImageUrl(profile.profileImageUrl) || profile.profileImageUrl}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    profile.companyName?.[0] || 'S'
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <h1 className="text-2xl font-bold text-gray-900">{profile.companyName}</h1>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} className="shrink-0" /> {profile.city}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {profile.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        <ShieldCheck size={12} /> Verified Seller
                      </span>
                    )}
                    <span className="text-xs text-gray-400">Member since {profile.memberSinceYear}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) goRegister();
                    else navigate('/messages', { state: { otherUserId: uid } });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
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
                  className="rounded-xl border border-rose-100 p-2 text-rose-600 hover:bg-rose-50"
                >
                  <Flag size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-b border-gray-100 bg-gray-50/80 px-5 py-5 sm:grid-cols-4 sm:gap-4 sm:px-6">
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
          <h2 className="mb-3 text-lg font-semibold text-gray-900">About</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
            {profile.description || 'No description provided.'}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Active listings from this seller</h2>
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
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Credentials</h2>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-4 text-sm text-gray-700 shadow-sm">
            {profile.isVerified ? (
              <p className="font-medium text-emerald-700">Verified</p>
            ) : (
              <p className="text-gray-500">This seller is not verified.</p>
            )}
          </div>
        </section>

        <section className="mb-8 mt-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">What buyers say</h2>
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
    <div className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <div className="mt-1 text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}
