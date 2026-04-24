import { Link } from 'react-router-dom';

const SMALL = [
  {
    title: '340+ Verified Suppliers',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop',
    href: '/',
  },
  {
    title: 'Premium Metal Scraps',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop',
    href: '/?type=Metal',
  },
  {
    title: 'E-Waste Materials',
    img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop',
    href: '/?type=Electronics',
  },
  {
    title: 'Textile Offcuts',
    img: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&auto=format&fit=crop',
    href: '/?type=Textile',
  },
];

export default function SmartSwapPromoBlocks() {
  return (
    <section className="mb-14">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Link
          to="/register"
          state={{ role: 'Seller' }}
          className="lg:col-span-3 relative min-h-[280px] lg:min-h-[360px] rounded-2xl overflow-hidden group"
        >
          <img
            src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=700&auto=format&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="text-emerald-300 text-xs font-bold tracking-widest">SMARTSWAP</span>
            <h3 className="text-2xl md:text-3xl font-extrabold mt-2 mb-2">Match & exchange materials</h3>
            <span className="font-semibold text-emerald-300 underline decoration-emerald-400/60 underline-offset-2">
              Try SmartSwap
            </span>
          </div>
        </Link>
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          {SMALL.map((b) => (
            <Link
              key={b.title}
              to={b.href}
              className="relative min-h-[120px] sm:min-h-[140px] rounded-xl overflow-hidden group"
            >
              <img
                src={b.img}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 text-white text-sm font-bold leading-tight">
                {b.title}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
