import api from './axiosInstance';

export const getUsers = (params) => api.get('/users', { params });

export const getAllUsers = (params) => api.get('/users', { params });

/** Admin-only: backend expects `searchTerm` on UserFilterDto */
export const searchUsers = (query, extra = {}) =>
  api.get('/users', {
    params: { searchTerm: query, pageSize: 20, ...extra },
  });

export const getUserById = (id) => api.get(`/users/${id}`);

/** Admin-only: create a user account (password required). */
export const createUser = (data) => api.post('/users', data);

export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const updateUserProfile = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const updateUserStatus = (id, { isActive }) =>
  isActive ? api.post(`/users/${id}/activate`) : api.post(`/users/${id}/suspend`);

export const putUserStatus = (id, status) => api.put(`/users/${id}/status`, { status });
export const getUserProfileImage = (id) => api.get(`/users/${id}/profile-image`);
export const uploadUserProfileImage = (id, formData) =>
  api.post(`/users/${id}/profile-image`, formData);

export const uploadProfileImage = uploadUserProfileImage;
