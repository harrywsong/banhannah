// ============================================
// frontend/src/api/endpoints/auth.js
// ============================================
import { apiClient } from '../client';

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  changePassword: (data) => apiClient.put('/auth/change-password', data),
  verifyEmail: (token) => apiClient.get(`/auth/verify-email?token=${token}`),
  resendVerification: (email) => apiClient.post('/auth/resend-verification', { email })
};