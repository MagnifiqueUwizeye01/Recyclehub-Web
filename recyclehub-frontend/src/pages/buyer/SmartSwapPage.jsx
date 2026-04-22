import { useEffect, useState } from 'react';
import BuyerLayout from '../../layouts/BuyerLayout';
import SmartSwapCard from '../../components/features/SmartSwapCard';
import ErrorState from '../../components/ui/ErrorState';
import { useSmartSwap } from '../../hooks/useSmartSwap';

export default function SmartSwapPage() {
  const { matches, loading, fetchBuyerMatches, respond } = useSmartSwap();
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        await fetchBuyerMatches();
      } catch (err) {
        console.error(err);
        setError('Failed to load SmartSwap matches. Please try again.');
      }
    };
    load();
  }, [fetchBuyerMatches]);

  return (
    <BuyerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">SmartSwap</h1>
        {loading && <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">Loading recommendations...</div>}
        {!loading && error && <ErrorState title="Unable to Load SmartSwap" message={error} onRetry={fetchBuyerMatches} />}
        {!loading && !error && (!Array.isArray(matches) || matches.length === 0) && (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-gray-600">No recommendations available right now.</div>
        )}
        {!loading && !error && Array.isArray(matches) && matches.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {matches.map((match) => (
              <SmartSwapCard key={match.id} match={match} onAccept={(id) => respond(id, 'Accepted')} onReject={(id) => respond(id, 'Rejected')} />
            ))}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
