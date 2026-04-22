const variants = {
  emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  amber: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  red: 'text-red-400 bg-red-400/10 border-red-400/30',
  blue: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  gray: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
  gold: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
};

export default function Badge({ children, variant = 'emerald', size = 'sm', className = '' }) {
  const sizes = { xs: 'px-1.5 py-0.5 text-xs', sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-sm' };
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-medium border rounded-md ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
