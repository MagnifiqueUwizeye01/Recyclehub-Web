import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import SellerLayout from '../../layouts/SellerLayout';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import { sellerMaterialFormSchema } from '../../utils/validators';
import { getMaterialById, updateMaterial } from '../../api/materials.api';
import { MATERIAL_TYPES } from '../../utils/constants';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const GRADE_HINT =
  'Optional. How pure or sorted the material is (e.g. Grade A, clean shred, mixed scrap) so buyers can compare listings.';

export default function EditMaterialPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(sellerMaterialFormSchema),
    defaultValues: { isSmartSwap: false, unit: 'kg', minOrderQty: 1 },
  });
  const isSmartSwap = watch('isSmartSwap');

  useEffect(() => {
    getMaterialById(id)
      .then((r) => {
        const m = r.data;
        reset({
          ...m,
          isSmartSwap: !!m.isSmartSwap,
          smartSwapDescription: m.smartSwapDescription || '',
        });
      })
      .catch(() => toast.error('Failed to load material details. Please try again.'))
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      const payload = {
        ...data,
        isSmartSwap: !!data.isSmartSwap,
        unitPrice: data.isSmartSwap ? 0 : data.unitPrice,
        smartSwapDescription: data.isSmartSwap ? (data.smartSwapDescription || '').trim() || null : null,
      };
      await updateMaterial(id, payload);
      toast.success('Listing updated successfully.');
      navigate('/seller/inventory');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/seller/inventory')}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600"
          >
            <ArrowLeft size={16} />
            Back to listings
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Edit listing</h1>
          <p className="text-sm text-gray-600">Update details for material #{id}. Photos are managed when you create the listing.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm lg:col-span-2">
            <Input label="Title" error={errors.title?.message} {...register('title')} />
            <Select label="Material Type" options={MATERIAL_TYPES} error={errors.materialType?.message} {...register('materialType')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Quantity" type="number" error={errors.quantity?.message} {...register('quantity')} />
              <Input label="Unit" error={errors.unit?.message} {...register('unit')} />
            </div>
            <input type="checkbox" className="sr-only" {...register('isSmartSwap')} />
            <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
              <p className="text-sm font-medium text-gray-900">Pricing type</p>
              <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="pricingTypeEdit"
                  checked={!isSmartSwap}
                  onChange={() => setValue('isSmartSwap', false, { shouldValidate: true })}
                />
                Set a fixed price
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="pricingTypeEdit"
                  checked={isSmartSwap}
                  onChange={() => {
                    setValue('isSmartSwap', true, { shouldValidate: true });
                    setValue('unitPrice', 0);
                  }}
                />
                SmartSwap offer
              </label>
            </div>
            {!isSmartSwap && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Unit Price (RWF)"
                  type="number"
                  error={errors.unitPrice?.message}
                  {...register('unitPrice')}
                />
                <Input label="Minimum Order Qty" type="number" error={errors.minOrderQty?.message} {...register('minOrderQty')} />
              </div>
            )}
            {isSmartSwap && (
              <div className="space-y-2">
                <Input label="Minimum Order Qty" type="number" error={errors.minOrderQty?.message} {...register('minOrderQty')} />
                <label className="block text-sm font-medium text-gray-700">Describe what you want to swap or exchange for (optional)</label>
                <textarea
                  rows={4}
                  {...register('smartSwapDescription')}
                  placeholder="Describe what you are looking to swap or exchange for this material (optional details)"
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm"
                />
              </div>
            )}
            <Input label="Grade" hint={GRADE_HINT} error={errors.grade?.message} {...register('grade')} />
            <Input label="City" error={errors.city?.message} {...register('city')} />
            <Input label="Address" error={errors.address?.message} {...register('address')} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm"
                placeholder="Material details"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <h2 className="mb-2 font-semibold text-gray-900">Save</h2>
              <p className="mb-4 text-sm text-gray-600">Changes apply to your live listing.</p>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/seller/inventory')}
                className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
            <p className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600">
              Listings are reviewed for accuracy. Clear grades and descriptions help buyers order with confidence.
            </p>
          </div>
        </form>
      </div>
    </SellerLayout>
  );
}
