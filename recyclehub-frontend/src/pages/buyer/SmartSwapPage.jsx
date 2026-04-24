import { useEffect, useState } from 'react';
import BuyerLayout from '../../layouts/BuyerLayout';
import ModernPageHeader from '../../components/ui/ModernPageHeader';
import PageLoadingCard from '../../components/ui/PageLoadingCard';
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
      <div className="w-full space-y-8">
        <ModernPageHeader
          title="SmartSwap"
          description="Exchange-style matches based on your interests and seller offers."
        />
        {loading && <PageLoadingCard message="Loading recommendations…" />}
        {!loading && error && <ErrorState title="Unable to load SmartSwap" message={error} onRetry={fetchBuyerMatches} />}
        {!loading && !error && (!Array.isArray(matches) || matches.length === 0) && (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            No recommendations available right now.
          </div>
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
