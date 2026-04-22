import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Star, Eye, ShieldCheck } from 'lucide-react';
import { formatRWF } from '../../utils/formatCurrency';
import { getMaterialImageUrl } from '../../utils/materialImages';

export default function MaterialCard({
  material,
  linkPrefix = '/buyer/materials',
  compact = false,
  showNew = false,
}) {
  const navigate = useNavigate();

  const go = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    navigate(`${linkPrefix}/${material.id}`);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => e.key === 'Enter' && go()}
      className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-100/80 transition-all duration-200 cursor-pointer"
    >
      <div className={`relative overflow-hidden bg-gray-50 ${compact ? 'h-44' : 'aspect-[4/3]'}`}>
        {material.primaryImageUrl ? (
          <img
            src={material.primaryImageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getMaterialImageUrl({ ...material, primaryImageUrl: null });
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <Package size={48} strokeWidth={1.25} />
          </div>
        )}

        {showNew && (
          <div className="absolute top-3 right-3 z-10">
            <span className="rounded-md bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">New</span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
          {material.grade && (
            <span className="inline-flex items-center rounded-md bg-white/95 px-2 py-0.5 text-xs font-medium text-gray-800 shadow-sm border border-gray-100">
              Grade {material.grade}
            </span>
          )}
          {material.materialType && (
            <span className="inline-flex items-center rounded-md bg-emerald-600/90 px-2 py-0.5 text-xs font-medium text-white">
              {material.materialType}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
          <Eye size={12} />
          <span>{material.viewCount ?? 0}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {material.title}
          </h3>
          {material.sellerVerified && (
            <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" aria-label="Verified seller" />
          )}
        </div>

        <p className="mt-1.5 flex items-center gap-1 text-sm text-gray-500">
          <MapPin size={14} className="shrink-0 text-gray-400" />
          {material.city || '—'}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Price</p>
            {material.isSmartSwap ? (
              <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-sm font-medium text-emerald-800">
                SmartSwap
              </span>
            ) : (
              <p className="text-sm font-semibold text-gray-900">
                {formatRWF(material.unitPrice)}
                <span className="text-gray-500 font-normal">
                  {' '}
                  per {material.unit || 'unit'}
                </span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">In stock</p>
            <p className="text-sm font-semibold text-gray-900">
              <span>{material.quantity}</span>
              <span className="text-gray-600 font-medium"> {material.unit || 'units'}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">
              {(material.sellerCompanyName?.[0] || 'S').toUpperCase()}
            </div>
            <span className="truncate text-sm text-gray-600">{material.sellerCompanyName || 'Seller'}</span>
          </div>
          {material.sellerRating > 0 && (
            <div className="flex shrink-0 items-center gap-0.5 text-amber-600">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{material.sellerRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
