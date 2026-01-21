import { apiEndpoint, apiRequest } from '../config/api';

export const resourcesApi = {
  // Get accessed resources
  async getAccessedResources() {
    const response = await apiRequest(apiEndpoint('resources/accessed'));
    if (!response.ok) throw new Error('Failed to get resources');
    return response.json();
  },

  // Record resource access
  async recordAccess(resourceId, resourceType, purchased = false) {
    const response = await apiRequest(apiEndpoint('resources/access'), {
      method: 'POST',
      body: JSON.stringify({ resourceId, resourceType, purchased })
    });
    if (!response.ok) throw new Error('Failed to record access');
    return response.json();
  }
};