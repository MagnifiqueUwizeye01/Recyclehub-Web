import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Package } from 'lucide-react';
import ImageGallery from '../../components/ui/ImageGallery';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { getMaterialById } from '../../api/materials.api';
import { getMaterialImages } from '../../api/materialImages.api';
import { formatRWF } from '../../utils/formatCurrency';
import { getMaterialImageUrl } from '../../utils/materialImages';
import { resolveMaterialAssetUrl } from '../../utils/assetUrl';
import VerifiedBadge from '../../components/features/VerifiedBadge';
import { useAuth } from '../../hooks/useAuth';

export default function MaterialDetailPublicPage() {
  const { id } = useParams();
  const { isAuthenticated, role } = useAuth();
  const [material, setMaterial] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const matRes = await getMaterialById(id);
        const mat = matRes.data;
        if (cancelled) return;
        setMaterial(mat);

        const urls = [];
        try {
          const imgRes = await getMaterialImages(id);
          const raw = imgRes.data;
          const arr = Array.isArray(raw) ? raw : raw?.data || raw?.items || [];
          if (Array.isArray(arr)) {
            arr.forEach((x) => {
              const u = x.imageUrl || x.url;
              if (u) {
                const abs = resolveMaterialAssetUrl(u);
                if (abs) urls.push({ url: abs });
              }
            });
          }
        } catch {
          /* use fallback */
        }
        if (!urls.length) urls.push({ url: getMaterialImageUrl(mat) });
        if (!cancelled) setImages(urls);
      } catch {
        if (!cancelled) setMaterial(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="text-center py-24">
        <p className="text-hub-muted mb-4">Material not found.</p>
        <Link to="/" className="text-emerald-600 font-semibold">
          Back to listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-fade-in">
      <nav className="text-xs text-hub-muted mb-6">
        <Link to="/" className="hover:text-emerald-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link
          to={`/?type=${encodeURIComponent(material.materialType)}`}
          className="hover:text-emerald-600"
        >
          {material.materialType}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-hub-text">{material.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <div className="relative rounded-2xl overflow-hidden border border-hub-border bg-white shadow-card">
            <ImageGallery images={images} />
            {material.sellerVerified && (
              <div className="absolute top-3 right-3 z-10">
                <VerifiedBadge />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-hub-text">{material.title}</h1>
          <div className="flex flex-wrap gap-2">
            {material.grade && (
              <span className="chip-grade-a px-3 py-1 rounded-full text-xs font-semibold">
                Grade: {material.grade}
              </span>
            )}
            <Badge variant="gray">{material.materialType}</Badge>
            <span className="inline-flex items-center gap-1 text-sm text-hub-muted">
              <MapPin size={14} /> {material.city || '—'}
            </span>
          </div>

          <div className="border-t border-hub-border pt-4">
            <p className="text-3xl font-extrabold text-emerald-600">
              {formatRWF(material.unitPrice)}
              <span className="text-base font-normal text-hub-muted"> /{material.unit || 'unit'}</span>
            </p>
            <p className="text-sm text-hub-muted mt-1 flex items-center gap-2">
              <Package size={14} /> Min. order: {material.minOrderQty || 1} {material.unit}
            </p>
          </div>

          {material.description && (
            <p className="text-sm text-hub-text leading-relaxed">{material.description}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {isAuthenticated && role === 'Buyer' ? (
              <Link to={`/buyer/materials/${id}`} className="btn-primary flex-1 justify-center text-center">
                Place order & pay
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  state={{ from: `/buyer/materials/${id}` }}
                  className="btn-primary flex-1 justify-center text-center"
                >
                  Sign in to order & pay
                </Link>
                <Link
                  to="/register"
                  state={{ preselectedRole: 'Buyer', from: `/buyer/materials/${id}` }}
                  className="inline-flex flex-1 items-center justify-center px-6 py-3 rounded-full border-2 border-hub-border font-semibold text-hub-text hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                >
                  Create buyer account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
