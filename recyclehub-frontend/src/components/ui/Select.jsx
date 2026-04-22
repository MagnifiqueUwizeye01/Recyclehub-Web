import { forwardRef } from 'react';

const Select = forwardRef(function Select({ label, error, options = [], className = '', placeholder, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-hub-textMuted font-body">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full bg-hub-surface border border-hub-border rounded-lg px-3 py-2.5 text-hub-text font-body text-sm focus:outline-none focus:border-hub-accent focus:ring-1 focus:ring-hub-accent/30 transition-all duration-200 disabled:opacity-50 appearance-none cursor-pointer ${error ? 'border-red-500/50' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

export default Select;
