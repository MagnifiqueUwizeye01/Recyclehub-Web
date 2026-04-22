import api from './axiosInstance';
import { unwrapApiPayload } from '../utils/authMapper';

export const getMaterialImages = async (materialId) => {
  const res = await api.get(`/materialimages/material/${materialId}`);
  try {
    const list = unwrapApiPayload(res);
    const arr = Array.isArray(list) ? list : [];
    return {
      data: arr.map((i) => ({
        ...i,
        url: i.imageUrl,
      })),
    };
  } catch {
    return { data: [] };
  }
};

export const uploadMaterialImage = (materialId, formData) =>
  api.post(`/materialimages/upload/${materialId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteMaterialImage = (imageId) => api.delete(`/materialimages/${imageId}`);

export const setPrimaryImage = (imageId) => api.post(`/materialimages/${imageId}/set-primary`);
