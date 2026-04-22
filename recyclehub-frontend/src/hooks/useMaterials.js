import { useState, useCallback } from 'react';
import { getMaterials, getMaterialById, getSellerMaterials } from '../api/materials.api';
import toast from 'react-hot-toast';

export const useMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [material, setMaterial] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchMaterials = useCallback(async (params) => {
    try {
      setLoading(true);
      const res = await getMaterials(params);
      const data = res.data;
      setMaterials(data.data || data || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMaterial = useCallback(async (id) => {
    try {
      setLoading(true);
      const res = await getMaterialById(id);
      setMaterial(res.data);
    } catch {
      toast.error('Failed to load material');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSellerMaterials = useCallback(async (userId, params) => {
    try {
      setLoading(true);
      const res = await getSellerMaterials(userId, params);
      const data = res.data;
      setMaterials(data.data || data || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  return { materials, material, loading, totalPages, totalCount, fetchMaterials, fetchMaterial, fetchSellerMaterials, setMaterials };
};

export default useMaterials;
