import { forwardRef } from 'react';

const Input = forwardRef(function Input({
  label,
  error,
  hint,
  className = '',
  icon,
  rightElement,
  ...props
}, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-hub-textMuted font-body">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-hub-muted">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`w-full bg-hub-surface border border-hub-border rounded-lg px-3 py-2.5 text-hub-text placeholder-hub-muted font-body text-sm focus:outline-none focus:border-hub-accent focus:ring-1 focus:ring-hub-accent/30 transition-all duration-200 disabled:opacity-50 ${icon ? 'pl-10' : ''} ${rightElement ? 'pr-10' : ''} ${error ? 'border-red-500/50 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </span>
        )}
      </div>
      {hint && !error && <p className="text-xs text-hub-muted">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

export default Input;
