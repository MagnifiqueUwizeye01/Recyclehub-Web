/** MTN MoMo logo from `public/brands/` (official artwork per your brand license). */
const LOGO_SRC = `${import.meta.env.BASE_URL}brands/151-1514348_mtn-momo-logo-mobile-money-logo-png-transparent.png`;

export default function MtnMomoMark({ className = 'h-10 w-auto max-h-12 object-contain' }) {
  return (
    <img
      src={LOGO_SRC}
      alt="MTN Mobile Money"
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
