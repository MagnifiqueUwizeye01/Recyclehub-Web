import { useNavigate } from 'react-router-dom';

const variants = {
  surface:
    'border border-gray-200/90 bg-white text-gray-800 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:text-emerald-800',
  dark: 'border border-white/20 bg-white/10 text-white hover:bg-white/15 hover:border-white/30',
  minimal: 'border-transparent bg-transparent text-gray-600 hover:bg-gray-100 hover:text-emerald-800',
};

/**
 * Deep links only (e.g. public seller profile). No arrow glyphs — label only.
 */
export default function PageBackButton({ fallback = '/', label = 'Back', variant = 'surface', className = '' }) {
  const navigate = useNavigate();

  const goBack = () => {
    const idx = window.history.state?.idx;
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallback);
  };

  const ring = variants[variant] || variants.surface;

  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold tracking-tight transition-colors ${ring} ${className}`}
    >
      {label}
    </button>
  );
}
