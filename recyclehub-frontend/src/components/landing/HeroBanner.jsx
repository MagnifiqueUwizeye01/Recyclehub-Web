import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    badge: 'TRUSTED B2B PLATFORM',
    badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
    heading: 'Source Verified\nRecyclable Materials',
    subtext: 'Connect with certified suppliers. Secure RWF payments.',
    cta: 'Browse Materials',
    ctaLink: '/',
    cta2: 'Become a Seller',
    cta2Link: '/register',
    cta2Role: 'Seller',
    image:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&auto=format&fit=crop',
    bgFrom: '#0d1b14',
    bgTo: '#064e3b',
  },
  {
    badge: 'SMARTSWAP',
    badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
    heading: 'Exchange & Match\nMaterials',
    subtext: 'Discover SmartSwap listings and connect with verified sellers for B2B trades.',
    cta: 'Try SmartSwap',
    ctaLink: '/register',
    ctaRole: 'Seller',
    image:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&auto=format&fit=crop',
    bgFrom: '#1a1a2e',
    bgTo: '#16213e',
  },
  {
    badge: 'FOR SUPPLIERS',
    badgeClass: 'bg-emerald-400/20 text-emerald-100 border-emerald-400/30',
    heading: 'List Your Materials.\nGet Verified. Earn More.',
    subtext: 'Join 340+ verified recycling companies. Start listing in 5 minutes.',
    cta: 'Register as Seller',
    ctaLink: '/register',
    ctaRole: 'Seller',
    image:
      'https://images.unsplash.com/photo-1611095973763-414019e72400?w=700&auto=format&fit=crop',
    bgFrom: '#064e3b',
    bgTo: '#065f46',
  },
];

export default function HeroBanner() {
  const [i, setI] = useState(0);
  const next = useCallback(() => setI((v) => (v + 1) % SLIDES.length), []);
  const prev = useCallback(() => setI((v) => (v - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  const slide = SLIDES[i];

  return (
    <section
      className="relative min-h-[420px] md:min-h-[520px] rounded-2xl overflow-hidden mx-4 md:mx-0 mb-8 shadow-card"
      aria-roledescription="carousel"
    >
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${slide.bgFrom} 0%, ${slide.bgTo} 100%)`,
        }}
      />
      <div className="relative z-10 grid md:grid-cols-2 gap-6 items-center min-h-[420px] md:min-h-[520px] px-6 md:px-12 py-10">
        <div className="text-left animate-fade-in">
          <span
            className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider border mb-4 ${slide.badgeClass}`}
          >
            {slide.badge}
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4 font-sans">
            {slide.heading.split('\n').map((line, idx) => (
              <span key={idx}>
                {line}
                {idx < slide.heading.split('\n').length - 1 && <br />}
              </span>
            ))}
          </h2>
          <p className="text-gray-300 text-sm md:text-base max-w-md mb-8">{slide.subtext}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={slide.ctaLink}
              className="btn-primary"
              state={slide.ctaRole ? { role: slide.ctaRole } : undefined}
            >
              {slide.cta} →
            </Link>
            {slide.cta2 && (
              <Link
                to={slide.cta2Link}
                state={slide.cta2Role ? { role: slide.cta2Role } : undefined}
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/40 text-white font-medium hover:bg-white/10 transition-colors text-sm"
              >
                {slide.cta2}
              </Link>
            )}
          </div>
        </div>
        <div className="relative h-56 md:h-[380px] md:absolute md:right-8 md:bottom-0 md:w-[45%] md:h-[90%] rounded-xl overflow-hidden shadow-2xl">
          <img
            src={slide.image}
            alt=""
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      </div>
      <button
        type="button"
        aria-label="Previous slide"
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-emerald-600 hover:bg-emerald-50"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        aria-label="Next slide"
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-emerald-600 hover:bg-emerald-50"
      >
        <ChevronRight size={22} />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              idx === i ? 'bg-emerald-400' : 'bg-white/40 ring-1 ring-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
