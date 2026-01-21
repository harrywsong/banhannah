import { apiEndpoint, apiRequest } from '../config/api';

export const registrationsApi = {
  // Get user's registrations
  async getRegistrations() {
    const response = await apiRequest(apiEndpoint('registrations'));
    if (!response.ok) throw new Error('Failed to get registrations');
    return response.json();
  },

  // Register for class
  async register(classId) {
    const response = await apiRequest(apiEndpoint('registrations'), {
      method: 'POST',
      body: JSON.stringify({ classId })
    });
    if (!response.ok) throw new Error('Failed to register');
    return response.json();
  },

  // Unregister from class
  async unregister(classId) {
    const response = await apiRequest(apiEndpoint(`registrations/${classId}`), {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to unregister');
    return response.json();
  },

  // Check if registered
  async checkRegistration(classId) {
    const response = await apiRequest(apiEndpoint(`registrations/check/${classId}`));
    if (!response.ok) throw new Error('Failed to check registration');
    return response.json();
  }
};