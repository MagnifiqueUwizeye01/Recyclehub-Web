import { Star } from 'lucide-react';

export default function StarRating({ value = 0, max = 5, onChange, size = 'md', className = '' }) {
  const sizes = { sm: 12, md: 16, lg: 20 };
  const s = sizes[size];

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[...Array(max)].map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          disabled={!onChange}
          className={`transition-colors ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <Star
            size={s}
            className={i < value ? 'text-amber-400 fill-amber-400' : 'text-hub-border'}
          />
        </button>
      ))}
    </div>
  );
}
