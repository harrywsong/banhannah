// ============================================
// frontend/src/api/endpoints/courses.js
// ============================================
import { apiClient } from '../client';

export const coursesAPI = {
  getAll: (params) => apiClient.get('/courses', { params }),
  getById: (id) => apiClient.get(`/courses/${id}`),
  create: (data) => apiClient.post('/courses', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => apiClient.put(`/courses/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => apiClient.delete(`/courses/${id}`),
  purchase: (id, data) => apiClient.post(`/courses/${id}/purchase`, data),
  enroll: (id) => apiClient.post(`/courses/${id}/enroll`),
  getMyCourses: () => apiClient.get('/courses/my/courses'),
  updateProgress: (id, data) => apiClient.put(`/courses/${id}/progress`, data)
};