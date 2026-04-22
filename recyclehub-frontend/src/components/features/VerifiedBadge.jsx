import { ShieldCheck } from 'lucide-react';

export default function VerifiedBadge({ size = 'sm', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-full font-body font-medium ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} ${className}`}>
      <ShieldCheck size={size === 'sm' ? 10 : 14} className="shrink-0" />
      Verified
    </span>
  );
}
