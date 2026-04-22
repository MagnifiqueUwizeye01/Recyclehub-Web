import { Zap, Check, X, ShieldCheck, ArrowRight, Activity } from 'lucide-react';
import MaterialCard from './MaterialCard';

export default function SmartSwapCard({ match, onAccept, onReject, className = '' }) {
  const score = match.matchScore || 0;
  const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-gray-400';

  return (
    <div className={`bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm group hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 ${className}`}>
      
      {/* Match Header */}
      <div className="p-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shadow-sm transition-transform group-hover:rotate-12">
            <Zap size={20} className="fill-amber-500" />
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 tracking-tighter uppercase italic leading-none">Smart <span className="text-amber-500">Match</span></h4>
            <div className="flex items-center gap-1.5 mt-1 border border-amber-100 bg-amber-50 px-2 py-0.5 rounded-lg">
               <ShieldCheck size={10} className="text-amber-600" />
               <span className="text-[8px] font-black uppercase text-amber-700">Verified Affinity</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic leading-none mb-1">Affinity Core</p>
          <div className="flex items-baseline gap-1">
             <span className={`text-4xl font-black italic tracking-tighter ${scoreColor}`}>{score}%</span>
          </div>
        </div>
      </div>

      <div className="p-8 pt-0 space-y-6">
        {/* Abstract the material card or show a condensed version */}
        {match.material && (
           <div className="rounded-[2rem] border border-gray-50 bg-gray-50/50 p-6 space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                    <img src={match.material.imageUrl || '/placeholder.png'} alt="" className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-black text-gray-900 uppercase tracking-tighter italic truncate leading-none mb-1">{match.material.title}</h5>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{match.material.materialType} segment</p>
                 </div>
              </div>
           </div>
        )}

        {match.suggestedReason && (
          <div className="relative p-6 bg-gray-900 rounded-[2rem] overflow-hidden group/reason">
             <Activity size={40} className="absolute -bottom-2 -right-2 opacity-10 text-emerald-400 rotate-12" />
             <p className="text-xs font-medium text-gray-400 leading-relaxed italic relative z-10">
               "{match.suggestedReason}"
             </p>
          </div>
        )}

        {match.matchStatus === 'Suggested' ? (
          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => onAccept?.(match.id)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Check size={16} strokeWidth={3} />
              Commit Swap
            </button>
            <button 
              onClick={() => onReject?.(match.id)}
              className="flex-1 bg-white border border-gray-100 hover:border-rose-200 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-2xl py-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
            >
              <X size={16} strokeWidth={3} />
              Sever Link
            </button>
          </div>
        ) : (
          <div className={`mt-6 p-4 rounded-2xl text-center border-t border-gray-50 bg-gray-50/50`}>
             <div className="flex items-center justify-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${match.matchStatus === 'Accepted' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${match.matchStatus === 'Accepted' ? 'text-emerald-700' : 'text-gray-400'}`}>
                   Match {match.matchStatus}
                </span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
