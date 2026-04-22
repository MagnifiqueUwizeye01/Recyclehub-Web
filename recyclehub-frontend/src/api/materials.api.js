import api from './axiosInstance';
import { unwrapApiPayload } from '../utils/authMapper';
import { normalizeMaterial } from '../utils/materialMapper';

function toMaterialQuery(f = {}) {
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 12;
  const sortBy = f.sortBy || 'newest';
  let sortField = 'CreatedAt';
  let sortDescending = true;
  if (sortBy === 'price_asc') {
    sortField = 'UnitPrice';
    sortDescending = false;
  } else if (sortBy === 'price_desc') {
    sortField = 'UnitPrice';
    sortDescending = true;
  } else if (sortBy === 'views') {
    sortField = 'ViewCount';
    sortDescending = true;
  }
  const types = f.types?.filter(Boolean);
  const materialType = types?.length ? types[0] : f.materialType;

  return {
    PageNumber: page,
    PageSize: pageSize,
    Status: f.status || 'Available',
    SearchTerm: f.search || undefined,
    City: f.city || undefined,
    MinPrice: f.minPrice !== undefined && f.minPrice !== '' ? Number(f.minPrice) : undefined,
    MaxPrice: f.maxPrice !== undefined && f.maxPrice !== '' ? Number(f.maxPrice) : undefined,
    MaterialType: materialType || undefined,
    SortBy: sortField,
    SortDescending: sortDescending,
    IsSmartSwap: f.smartSwapOnly ? true : undefined,
  };
}

export const getMaterials = async (filters) => {
  const res = await api.get('/materials', { params: toMaterialQuery(filters) });
  const p = res.data;
  const items = (p.items || []).map(normalizeMaterial);
  return {
    data: {
      data: items,
      totalPages: p.totalPages ?? 1,
      totalCount: p.totalCount ?? items.length,
    },
  };
};

export const getMaterialById = async (id) => {
  const res = await api.get(`/materials/${id}`);
  const raw = unwrapApiPayload(res);
  return { data: normalizeMaterial(raw) };
};

export const getMaterialsBySellerUser = async (sellerUserId, filters = {}) => {
  const res = await api.get(`/materials/seller/${sellerUserId}`, {
    params: toMaterialQuery({ ...filters, page: filters.page ?? 1, pageSize: filters.pageSize ?? 24 }),
  });
  const p = res.data;
  const items = (p.items || []).map(normalizeMaterial);
  return {
    data: {
      data: items,
      totalPages: p.totalPages ?? 1,
      totalCount: p.totalCount ?? items.length,
    },
  };
};

export const createMaterial = (data) => api.post('/materials', data);
export const updateMaterial = (id, data) => api.put(`/materials/${id}`, data);
export const deleteMaterial = (id) => api.delete(`/materials/${id}`);
export const verifyMaterial = (id, data) => api.put(`/materials/${id}/verify`, data);
export const getSellerMaterials = (params) => api.get('/materials/my', { params });
export const getPendingMaterials = (params) => api.get('/materials/pending', { params });
