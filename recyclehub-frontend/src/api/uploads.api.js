import api from './axiosInstance';
import { unwrapApiPayload } from '../utils/authMapper';

/** Upload seller license during registration; returns relative URL e.g. /uploads/licenses/{guid}.pdf */
export async function uploadSellerLicense(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post('/uploads/seller-license', fd);
  return unwrapApiPayload(res);
}
