import api from './axiosInstance';
import { unwrapApiPayload, mapAuthResponseDto, mapCurrentUserDto } from '../utils/authMapper';

export const login = async (data) => {
  const res = await api.post('/auth/login', data);
  const dto = unwrapApiPayload(res);
  return mapAuthResponseDto(dto);
};

function throwIfApiFailed(res) {
  const body = res?.data;
  if (body && typeof body.success === 'boolean' && !body.success) {
    const msg =
      body.message ||
      (Array.isArray(body.errors) && body.errors.length ? body.errors.join(', ') : '') ||
      'Request failed';
    const err = new Error(msg);
    err.apiBody = body;
    throw err;
  }
}

/** @param {{ challengeToken: string, code: string }} data */
export const completeTwoFactorLogin = async (data) => {
  const res = await api.post('/auth/login/2fa', {
    challengeToken: data.challengeToken,
    code: data.code,
  });
  const dto = unwrapApiPayload(res);
  return mapAuthResponseDto(dto);
};

export const beginTwoFactorSetup = async () => {
  const res = await api.post('/auth/2fa/setup');
  throwIfApiFailed(res);
  return res?.data?.message ?? '';
};

export const confirmTwoFactorSetup = async (code) => {
  const res = await api.post('/auth/2fa/confirm', { code });
  throwIfApiFailed(res);
  return res?.data?.message ?? '';
};

export const disableTwoFactor = async (password) => {
  const res = await api.post('/auth/2fa/disable', { password });
  throwIfApiFailed(res);
  return res?.data?.message ?? '';
};

export const cancelTwoFactorSetup = async () => {
  const res = await api.post('/auth/2fa/cancel');
  throwIfApiFailed(res);
  return res?.data?.message ?? '';
};

export const register = async (data) => {
  const res = await api.post('/auth/register', data);
  const dto = unwrapApiPayload(res);
  return mapAuthResponseDto(dto);
};

export const forgotPassword = async (data) => {
  const res = await api.post('/auth/forgot-password', data);
  unwrapApiPayload(res);
  return res?.data?.message ?? 'Request received.';
};

/** @param {{ email: string, otp: string, newPassword: string }} data */
export const resetPassword = async (data) => {
  const res = await api.post('/auth/reset-password', data);
  unwrapApiPayload(res);
  return res?.data?.message ?? '';
};
export const changePassword = (data) => api.post('/auth/change-password', data);

export const getMe = async () => {
  const res = await api.get('/auth/me');
  const dto = unwrapApiPayload(res);
  return mapCurrentUserDto(dto);
};

export const getCurrentUser = getMe;
