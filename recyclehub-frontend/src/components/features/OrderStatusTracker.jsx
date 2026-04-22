import { getOrderStatusStep } from '../../utils/statusHelpers';
import { formatDate } from '../../utils/formatDate';
import { Check, Circle, Activity, Clock, ShieldCheck, Zap } from 'lucide-react';

const STEPS = ['Payment', 'Pending', 'Accepted', 'Paid', 'Shipped', 'Delivered'];

export default function OrderStatusTracker({ status, history = [], className = '' }) {
  const currentStep = getOrderStatusStep(status);

  return (
    <div className={`flex items-start justify-between relative px-2 ${className}`}>
      {/* Background Progression Line */}
      <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-50 z-0" />
      
      {STEPS.map((step, i) => {
        const done = i < currentStep;
        const current = i === currentStep;
        const future = i > currentStep;
        const log = history.find((h) => h.status === step);
        
        return (
          <div key={step} className="flex-1 flex flex-col items-center relative z-10">
            <div className="flex flex-col items-center">
              {/* Dynamic Connecting Line (Active) */}
              {i > 0 && (
                <div 
                  className={`absolute -left-1/2 right-1/2 top-5 h-0.5 transition-all duration-1000 ${done ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-transparent'}`} 
                />
              )}
              
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 ${
                done 
                ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' 
                : current 
                  ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/5' 
                  : 'bg-white border-gray-100'
              }`}>
                {done ? (
                  <ShieldCheck size={18} className="text-white" strokeWidth={3} />
                ) : current ? (
                  <Zap size={18} className="text-emerald-500 fill-emerald-500 animate-pulse" />
                ) : (
                  <Circle size={14} className="text-gray-200" />
                )}
              </div>

              <div className="mt-4 text-center space-y-1">
                <p className={`text-[10px] font-black uppercase tracking-widest ${
                  current ? 'text-emerald-600 italic' : done ? 'text-gray-900' : 'text-gray-300'
                }`}>
                  {step}
                </p>
                {log?.date && (
                  <div className="flex items-center justify-center gap-1 text-[8px] font-medium text-gray-400 italic">
                    <Clock size={8} />
                    {formatDate(log.date)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
