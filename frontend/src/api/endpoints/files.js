// ============================================
// frontend/src/api/endpoints/files.js
// ============================================
import { apiClient } from '../client';

export const filesAPI = {
  getAll: (params) => apiClient.get('/files', { params }),
  getById: (id) => apiClient.get(`/files/${id}`),
  upload: (data) => apiClient.post('/files', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => apiClient.put(`/files/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => apiClient.delete(`/files/${id}`),
  download: (filename) => `/api/files/download/${filename}`,
  view: (filename) => `/api/files/view/${filename}`
};
