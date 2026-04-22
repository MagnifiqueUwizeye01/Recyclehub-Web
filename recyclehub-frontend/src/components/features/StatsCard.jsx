export default function StatsCard({ label, value, icon, trend, trendLabel, color = 'emerald', className = '' }) {
  const colors = {
    emerald: 'text-hub-accent bg-hub-accent/10 border-hub-accent/20',
    amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    red: 'text-red-400 bg-red-400/10 border-red-400/20',
    gray: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
  };
  return (
    <div className={`bg-hub-surface border border-hub-border rounded-xl p-5 hover:border-hub-accent/30 transition-all group ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-hub-muted font-body mb-1 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-display font-bold text-hub-text">{value ?? '—'}</p>
          {trendLabel && (
            <p className={`text-xs mt-1 font-body ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-hub-muted'}`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : ''} {trendLabel}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
