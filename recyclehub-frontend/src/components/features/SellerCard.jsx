import { MapPin, Star, Package, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SellerCard({ seller, className = '' }) {
  const navigate = useNavigate();
  return (
    <div className={`bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-black text-xl group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors shadow-sm shrink-0">
          {seller.companyName?.[0] || 'V'}
        </div>
        
        <div className="flex-1 text-center sm:text-left space-y-2">
           <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h4 className="text-xl font-black text-gray-900 tracking-tighter italic uppercase">{seller.companyName || 'Seller'}</h4>
              {seller.verificationStatus === 'Verified' && (
                 <div className="flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl border border-emerald-100 self-center sm:self-auto">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Verified Seller</span>
                 </div>
              )}
           </div>
           
           <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-400">
              <MapPin size={12} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.15em] italic">{seller.city || 'Sector Undetermined'}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-50">
        <div className="space-y-1">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic mb-2">Vendor Loyalty</p>
           {seller.averageRating > 0 ? (
             <div className="flex items-center gap-2">
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span className="text-lg font-black text-gray-900 tracking-tighter italic">{seller.averageRating?.toFixed(1)}</span>
                <span className="text-[9px] text-gray-300 font-black uppercase italic">Rating</span>
             </div>
           ) : (
             <span className="text-[10px] font-black text-gray-300 uppercase italic">Unrated Baseline</span>
           )}
        </div>
        
        <div className="text-right space-y-1">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic mb-2">Inventory Volume</p>
           <div className="flex items-center justify-end gap-2">
              <Package size={16} className="text-emerald-500" />
              <span className="text-lg font-black text-gray-900 tracking-tighter italic uppercase">{seller.totalListings || 0}</span>
              <span className="text-[9px] text-gray-300 font-black uppercase italic">Assets</span>
           </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/messages', { state: { otherUserId: seller.userId || seller.id } })}
        className="w-full mt-8 flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95 transition-all shadow-xl shadow-gray-200"
      >
        <MessageSquare size={16} className="group-hover:rotate-12 transition-transform" />
        Message Seller
      </button>
    </div>
  );
}
