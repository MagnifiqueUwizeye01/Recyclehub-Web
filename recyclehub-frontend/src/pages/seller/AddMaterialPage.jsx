import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import SellerLayout from '../../layouts/SellerLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FileUpload from '../../components/ui/FileUpload';
import { sellerMaterialFormSchema } from '../../utils/validators';
import { MATERIAL_TYPES } from '../../utils/constants';
import { createMaterial } from '../../api/materials.api';
import { uploadMaterialImage } from '../../api/materialImages.api';
import toast from 'react-hot-toast';

export default function AddMaterialPage() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(sellerMaterialFormSchema),
    defaultValues: { isSmartSwap: false, unit: 'kg', minOrderQty: 1 },
  });
  const isSmartSwap = watch('isSmartSwap');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        isSmartSwap: !!data.isSmartSwap,
        unitPrice: data.isSmartSwap ? 0 : data.unitPrice,
        smartSwapDescription: data.isSmartSwap ? (data.smartSwapDescription || '').trim() || null : null,
      };
      const matRes = await createMaterial(payload);
      const materialId = matRes?.data?.data?.materialId ?? matRes?.data?.materialId ?? matRes?.data?.id;
      for (let index = 0; index < images.length; index += 1) {
        const formData = new FormData();
        formData.append('file', images[index]);
        formData.append('isPrimary', index === 0 ? 'true' : 'false');
        formData.append('sortOrder', String(index));
        await uploadMaterialImage(materialId, formData);
      }
      toast.success('Listing added successfully.');
      navigate('/seller/inventory');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to load listing creation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SellerLayout>
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <ModernPageHeader
          title="Add listing"
          description="Create a new recycling material listing for buyers on the marketplace."
        />

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
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
                  name="pricingType"
                  checked={!isSmartSwap}
                  onChange={() => {
                    setValue('isSmartSwap', false, { shouldValidate: true });
                  }}
                />
                Set a fixed price
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="pricingType"
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
                <Input label="Unit Price (RWF)" type="number" error={errors.unitPrice?.message} {...register('unitPrice')} />
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
            <Input
              label="Grade"
              hint="Optional. Quality or purity tier (e.g. Grade A, clean shred) so buyers can compare listings."
              error={errors.grade?.message}
              {...register('grade')}
            />
            <Input label="City" error={errors.city?.message} {...register('city')} />
            <Input label="Address" error={errors.address?.message} {...register('address')} />
            <textarea {...register('description')} rows={4} className="w-full rounded-xl border border-gray-200 p-3 text-sm" placeholder="Material details" />
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-gray-900">Photos</h2>
              <FileUpload multiple maxFiles={5} onFileSelect={setImages} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save listing'}
            </button>
          </div>
        </form>
      </div>
    </SellerLayout>
  );
}
