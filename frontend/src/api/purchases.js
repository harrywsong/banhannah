import { apiEndpoint, apiRequest } from '../config/api';

export const purchasesApi = {
  // Get user's purchases
  async getPurchases() {
    const response = await apiRequest(apiEndpoint('purchases'));
    if (!response.ok) throw new Error('Failed to get purchases');
    return response.json();
  },

  // Create purchase
  async createPurchase(purchaseData) {
    const response = await apiRequest(apiEndpoint('purchases'), {
      method: 'POST',
      body: JSON.stringify(purchaseData)
    });
    if (!response.ok) throw new Error('Failed to create purchase');
    return response.json();
  },

  // Check if course is purchased
  async checkPurchase(courseId) {
    const response = await apiRequest(apiEndpoint(`purchases/check/${courseId}`));
    if (!response.ok) throw new Error('Failed to check purchase');
    return response.json();
  }
};