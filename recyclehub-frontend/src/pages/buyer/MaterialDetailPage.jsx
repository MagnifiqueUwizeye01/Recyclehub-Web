import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import BuyerLayout from '../../layouts/BuyerLayout';
import ImageGallery from '../../components/ui/ImageGallery';
import Badge from '../../components/ui/Badge';
import { getMaterialById } from '../../api/materials.api';
import { getMaterialImages } from '../../api/materialImages.api';
import { createOrder } from '../../api/orders.api';
import { formatRWF } from '../../utils/formatCurrency';
import { getMaterialImageUrl } from '../../utils/materialImages';
import { resolveMaterialAssetUrl } from '../../utils/assetUrl';
import { unwrapApiPayload, getApiErrorMessage } from '../../utils/authMapper';
import { MapPin, Package, ShoppingCart, Info, ShieldCheck, Star, Flag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildOrderSchema } from '../../utils/validators';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import ReportModal from '../../components/features/ReportModal';
import Spinner from '../../components/ui/Spinner';

export default function MaterialDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [material, setMaterial] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const matRes = await getMaterialById(id);
        const mat = matRes.data;
        if (cancelled) return;
        setMaterial(mat);

        const urls = [];
        try {
          const imgRes = await getMaterialImages(id);
          const raw = imgRes.data;
          const arr = Array.isArray(raw) ? raw : [];
          arr.forEach((x) => {
            const u = x.imageUrl || x.url;
            if (u) {
              const abs = resolveMaterialAssetUrl(u);
              if (abs) urls.push({ url: abs });
            }
          });
        } catch {
          /* optional */
        }
        if (!urls.length && mat) urls.push({ url: getMaterialImageUrl(mat) });
        if (!cancelled) setImages(urls);

      } catch {
        if (!cancelled) toast.error('Failed to load material details. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const goRegisterBuyer = (msg) => {
    toast(msg, { icon: 'ℹ️' });
    navigate('/register', { state: { preselectedRole: 'Buyer' } });
  };

  if (loading) {
    return (
      <BuyerLayout>
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </BuyerLayout>
    );
  }

  if (!material) {
    return (
      <BuyerLayout>
        <div className="text-center py-24 space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto">
            <Info size={32} />
          </div>
          <p className="text-sm text-gray-600">Material not found.</p>
          <Link to="/buyer/marketplace" className="text-emerald-600 font-medium hover:underline">
            Back to marketplace
          </Link>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="mx-auto max-w-6xl animate-fade-in space-y-8 pb-12">
        <nav className="text-sm text-gray-500">
          <Link to="/buyer/marketplace" className="hover:text-emerald-600">
            Marketplace
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium line-clamp-1">{material.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
              <ImageGallery images={images} className="aspect-square object-cover" />
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 border border-gray-100">
                <Package size={14} className="text-emerald-600" />
                {material.materialType}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-100 text-emerald-800">
                {material.status || 'Available'}
              </span>
              <span className="inline-flex items-center gap-1 text-gray-500">
                <Info size={14} />
                {material.viewCount ?? 0} views
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent md:text-3xl">
                {material.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <MapPin size={16} className="text-emerald-600 shrink-0" />
                <span>
                  {material.city}
                  {material.address ? ` · ${material.address}` : ''}
                </span>
              </div>
              {material.grade && (
                <p className="mt-2 text-sm">
                  <Badge variant="gray">Grade: {material.grade}</Badge>
                </p>
              )}
            </div>

            {material.isSmartSwap ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-6 space-y-2">
                <p className="text-sm font-medium text-emerald-900">SmartSwap offer</p>
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {material.smartSwapDescription ||
                    'The seller is open to exchanging this material — contact them to negotiate terms.'}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Price</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {formatRWF(material.unitPrice)}
                    <span className="text-base font-normal text-gray-500"> / {material.unit || 'unit'}</span>
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">In stock</p>
                  <p className="text-lg font-semibold text-emerald-700 mt-1">
                    {material.quantity} {material.unit}
                    <span className="text-sm font-normal text-gray-600"> available</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Min. order {material.minOrderQty || 1}</p>
                </div>
              </div>
            )}

            {material.description && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{material.description}</p>
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">Seller</h2>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold shrink-0">
                  {(material.sellerCompanyName || 'S')?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900 truncate">{material.sellerCompanyName || 'Seller'}</span>
                    {material.sellerVerified !== false && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <ShieldCheck size={12} /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin size={12} /> {material.sellerCity || material.city}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                    <Star size={14} className="text-amber-500 shrink-0" />
                    {(material.sellerRating ?? 0).toFixed?.(1) ?? material.sellerRating}
                    <span className="text-gray-400">·</span>
                    <span>Sales on RecycleHub</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/sellers/${material.sellerUserId}`)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  View profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      goRegisterBuyer('Sign up to message this seller');
                      return;
                    }
                    navigate('/messages', {
                      state: {
                        otherUserId: material.sellerUserId,
                        productContext: {
                          sellerUserId: material.sellerUserId,
                          materialId: Number(id),
                          title: material.title,
                          unitPrice: material.unitPrice,
                          unit: material.unit,
                          city: material.city,
                        },
                      },
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                >
                  Message seller
                </button>
                <button
                  type="button"
                  title="Report"
                  onClick={() => {
                    if (!isAuthenticated) {
                      goRegisterBuyer('Sign up to report');
                      return;
                    }
                    setReportOpen(true);
                  }}
                  className="py-2.5 px-3 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50"
                >
                  <Flag size={18} />
                </button>
              </div>
            </div>

            <MaterialOrderForm
              material={material}
              materialId={Number(id)}
              isAuthenticated={isAuthenticated}
              goRegisterBuyer={goRegisterBuyer}
            />
          </div>
        </div>
      </div>
      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedUserId={material.sellerUserId}
        reportedUserName={material.sellerCompanyName}
        context="profile"
      />
    </BuyerLayout>
  );
}

function MaterialOrderForm({ material, materialId, isAuthenticated, goRegisterBuyer }) {
  const navigate = useNavigate();
  const [ordering, setOrdering] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(buildOrderSchema(!!material?.isSmartSwap)),
    defaultValues: {
      quantityOrdered: material?.minOrderQty || 1,
      offeredUnitPrice: material?.unitPrice ?? 0,
      shippingAddress: 'Kigali, Rwanda',
      buyerNote: '',
    },
  });

  useEffect(() => {
    if (!material) return;
    setValue('offeredUnitPrice', material.isSmartSwap ? 0 : material.unitPrice);
    setValue('quantityOrdered', material.minOrderQty || 1);
    setValue('shippingAddress', 'Kigali, Rwanda');
  }, [material, setValue]);

  const watchedQty   = Number(watch('quantityOrdered'))   || 0;
  const watchedPrice = Number(watch('offeredUnitPrice'))   || 0;
  const unitPrice    = material.isSmartSwap ? watchedPrice : (material.unitPrice ?? 0);
  const totalPrice   = watchedQty * unitPrice;

  const onOrder = async (data) => {
    if (!isAuthenticated) {
      goRegisterBuyer('Please create a free buyer account to place orders.');
      return;
    }
    try {
      setOrdering(true);
      const res = await createOrder({ ...data, materialId, currency: 'RWF' });
      const created = unwrapApiPayload(res);
      const orderId = created?.orderId ?? created?.id;
      toast.success('Complete mobile money payment to confirm your order.');
      if (orderId != null) {
        navigate(`/buyer/payment/${orderId}`);
      } else {
        navigate('/buyer/orders');
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Could not place order.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onOrder)}
      className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-sm space-y-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Place order</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter quantity and delivery details. You will pay with MTN MoMo before the seller is notified.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            step="1"
            required
            {...register('quantityOrdered')}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          {errors.quantityOrdered && (
            <p className="text-xs text-red-600 mt-1">{errors.quantityOrdered.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {material.isSmartSwap ? 'Proposed unit price (RWF, 0 for swap)' : 'Unit price (RWF)'}
          </label>
          <input
            type="number"
            step="0.01"
            required={!material.isSmartSwap}
            readOnly={!material.isSmartSwap}
            {...register('offeredUnitPrice')}
            className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none ${
              material.isSmartSwap
                ? 'border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed select-none'
            }`}
          />
          {!material.isSmartSwap && (
            <p className="text-xs text-gray-400 mt-1">Price is set by the seller and cannot be changed.</p>
          )}
          {errors.offeredUnitPrice && (
            <p className="text-xs text-red-600 mt-1">{errors.offeredUnitPrice.message}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Shipping address</label>
          <input
            required
            {...register('shippingAddress')}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            placeholder="City, street, instructions…"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Note to seller (optional)</label>
          <textarea
            rows={3}
            placeholder="Delivery preferences or questions…"
            {...register('buyerNote')}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
          />
        </div>
      </div>

      {/* Order summary */}
      {watchedQty > 0 && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-5 py-4 space-y-2">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Order summary</p>
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>
              {watchedQty} {material.unit || 'unit'} × {formatRWF(unitPrice)}
            </span>
            <span className="font-bold text-lg text-emerald-700">{formatRWF(totalPrice)}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={ordering}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
      >
        <ShoppingCart size={18} className={ordering ? 'animate-pulse' : ''} />
        {ordering ? 'Placing order…' : 'Place order'}
      </button>
    </form>
  );
}
