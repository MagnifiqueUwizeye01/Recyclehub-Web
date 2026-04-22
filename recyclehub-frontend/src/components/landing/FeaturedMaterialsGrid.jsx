import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MaterialCard from '../features/MaterialCard';
import { getMaterials } from '../../api/materials.api';
import Spinner from '../ui/Spinner';

export default function FeaturedMaterialsGrid() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMaterials({ status: 'Available', pageSize: 8, page: 1 });
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
  }, []);

  return (
    <section className="mb-14">
      <div className="section-label">Our Materials</div>
      <h2 className="section-heading">Explore Featured Listings</h2>
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {materials.slice(0, 8).map((m) => (
            <MaterialCard key={m.id} material={m} linkPrefix="/m" compact />
          ))}
        </div>
      )}
      <div className="text-center mt-10">
        <Link to="/" className="btn-primary inline-flex">
          View All Materials
        </Link>
      </div>
    </section>
  );
}
