const variants = {
  primary: 'bg-hub-accent hover:bg-hub-accentHover text-white border-transparent',
  secondary: 'bg-hub-surface2 hover:bg-hub-border text-hub-text border-hub-border',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30',
  ghost: 'bg-transparent hover:bg-hub-surface2 text-hub-muted hover:text-hub-text border-transparent',
  outline: 'bg-transparent hover:bg-hub-surface2 text-hub-accent border-hub-accent',
  gold: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const sizes = {
  xs: 'px-2 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
  xl: 'px-8 py-4 text-lg rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-body font-medium border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
