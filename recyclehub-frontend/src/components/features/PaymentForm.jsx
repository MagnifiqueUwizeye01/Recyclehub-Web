import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { initiatePayment } from '../../api/payments.api';
import { formatRWF } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../utils/authMapper';
import { Phone, ShieldCheck, Zap, ArrowRight, Lock } from 'lucide-react';
import MtnMomoMark from '../brands/MtnMomoMark';

const schema = z.object({ phoneNumber: z.string().min(10, 'Enter valid phone number') });

export default function PaymentForm({ order, onSuccess, paymentMethod = 'MobileMoney', className = '' }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const orderId = order?.orderId ?? order?.id ?? order?.OrderId;
      await initiatePayment({
        orderId: Number(orderId),
        phoneNumber: data.phoneNumber,
        currency: order?.currency || 'RWF',
        paymentChannel: paymentMethod,
      });
      toast.success('Payment request sent. Check your MoMo prompt.');
      onSuccess?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err) || 'Payment request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-8 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <MtnMomoMark className="h-11 w-auto max-w-[200px]" />
        <p className="text-xs font-medium text-gray-500">Pay securely with MTN Mobile Money</p>
      </div>

      {/* Transaction Diagnostic Header */}
      <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-2 group transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/50">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-none">Aggregate Fiscal Liability</p>
        <h3 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">{formatRWF(order?.totalAmount)}</h3>
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 italic">
           <ShieldCheck size={12} strokeWidth={3} />
           <span className="text-[9px] font-black uppercase tracking-widest">Secure Valuation</span>
        </div>
      </div>

      {/* Input Sector */}
      <div className="space-y-6">
        <div className="space-y-3">
           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">MoMo Terminal Identity (Phone Number)</label>
           <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                 <Phone size={18} />
              </div>
              <input 
                placeholder="e.g. 078XXXXXXX"
                {...register('phoneNumber')}
                className="w-full bg-gray-50 border border-gray-100 rounded-3xl pl-14 pr-6 py-5 text-sm font-black text-gray-900 focus:outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
              />
           </div>
           {errors.phoneNumber && <p className="text-[10px] font-bold text-rose-500 uppercase italic ml-1">{errors.phoneNumber.message}</p>}
        </div>
      </div>

      {/* Control Fragment */}
      <div className="space-y-5">
         <button 
           type="submit" 
           disabled={loading}
           className="w-full bg-gray-900 text-white rounded-[2rem] py-6 flex items-center justify-center gap-4 transition-all hover:bg-emerald-600 shadow-2xl shadow-gray-200 hover:shadow-emerald-500/20 active:scale-[0.98] group"
         >
            {loading ? (
               <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
               <Zap size={20} className="group-hover:text-amber-300 transition-colors" />
            )}
            <span className="text-xs font-black uppercase tracking-[0.3em]">
              {loading ? 'Sending Request...' : 'Pay with MTN MoMo'}
            </span>
            {!loading && <ArrowRight size={20} className="ml-2" />}
         </button>
         
         <div className="flex items-center justify-center gap-4 opacity-40">
            <Lock size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 italic">Encrypted payment channel</span>
         </div>
      </div>

      {/* Vendor Note Segment */}
      <div className="p-6 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
         <p className="text-[9px] font-medium text-gray-500 italic leading-relaxed text-center">
           Upon initialization, a push-notification request will be transmitted to your terminal. Authenticate with your secret PIN to finalize the fiscal transfer.
         </p>
      </div>
    </form>
  );
}
