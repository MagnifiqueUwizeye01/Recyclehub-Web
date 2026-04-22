import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MaterialCard from '../features/MaterialCard';
import { getMaterials } from '../../api/materials.api';
import Spinner from '../ui/Spinner';

const TABS = [
  { id: '24h', label: 'Last 24h' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

export default function NewVerifiedListings() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('week');
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await getMaterials({
          status: 'Available',
          sortBy: 'newest',
          pageSize: 12,
          page: 1,
        });
        const data = res.data;
        const list = data.data || data || [];
        if (!cancelled) setMaterials(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setMaterials([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <section className="mb-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="section-label">Latest</div>
          <h2 className="section-heading !mb-0">New Verified Listings</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-hub-section text-hub-muted hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="flex gap-1 ml-2">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scroll(-1)}
              className="p-2 rounded-full border border-hub-border hover:bg-emerald-50"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scroll(1)}
              className="p-2 rounded-full border border-hub-border hover:bg-emerald-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin"
          style={{ scrollbarWidth: 'thin' }}
        >
          {materials.length === 0 ? (
            <p className="text-hub-muted py-8">No listings available yet. Check back soon.</p>
          ) : (
            materials.map((m) => (
              <div key={m.id} className="min-w-[220px] max-w-[240px] snap-start shrink-0">
                <MaterialCard material={m} linkPrefix="/m" compact showNew />
              </div>
            ))
          )}
        </div>
      )}

      <div className="text-center mt-8">
        <Link to="/" className="btn-primary inline-flex">
          View all materials
        </Link>
      </div>
    </section>
  );
}
