import StarRating from '../ui/StarRating';
import { timeAgo } from '../../utils/formatDate';
import { Quote, ShieldCheck, Activity } from 'lucide-react';

export default function ReviewCard({ review, className = '' }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-[2.5rem] p-8 group hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 relative overflow-hidden ${className}`}>
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
         <Quote size={60} />
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 border border-gray-100">
                <span className="text-xs font-black uppercase italic">{(review.buyerFullName || review.buyerName)?.[0] || 'A'}</span>
             </div>
             <div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tighter italic leading-none mb-1">{review.buyerFullName || review.buyerName || 'Anonymous'}</p>
                <div className="flex items-center gap-1.5">
                   <Activity size={10} className="text-emerald-500" />
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Verified Procurement</span>
                </div>
             </div>
          </div>
          
          <div className="relative">
             <p className="text-sm font-medium text-gray-600 leading-relaxed italic pr-6 italic">
                "{review.comment ?? review.Comment ?? ''}"
             </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-2xl flex items-center gap-3">
             <StarRating value={review.rating} size="sm" />
             <div className="w-px h-3 bg-gray-200" />
             <span className="text-xs font-black text-gray-900 italic">{review.rating}.0</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest italic">
             <ShieldCheck size={10} />
             {timeAgo(review.createdAt)}
          </div>
        </div>
      </div>

      {review.materialTitle && (
         <div className="mt-8 pt-6 border-t border-gray-50 flex items-center gap-4">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic leading-none">Context Asset:</p>
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter italic bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">{review.materialTitle}</span>
         </div>
      )}
    </div>
  );
}
