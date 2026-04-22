import { useState, useCallback } from 'react';
import { getBuyerMatches, getSellerMatches, respondToMatch } from '../api/smartSwap.api';
import toast from 'react-hot-toast';

export const useSmartSwap = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBuyerMatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBuyerMatches();
      setMatches(res.data || []);
    } catch {
      toast.error('Failed to load SmartSwap matches');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSellerMatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSellerMatches();
      setMatches(res.data || []);
    } catch {
      toast.error('Failed to load SmartSwap matches');
    } finally {
      setLoading(false);
    }
  }, []);

  const respond = useCallback(async (matchId, status) => {
    await respondToMatch(matchId, { matchStatus: status });
    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, matchStatus: status } : m));
    toast.success(`Match ${status.toLowerCase()}`);
  }, []);

  return { matches, loading, fetchBuyerMatches, fetchSellerMatches, respond };
};

export default useSmartSwap;
