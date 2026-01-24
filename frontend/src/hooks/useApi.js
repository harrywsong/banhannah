// frontend/src/hooks/useApi.js
// ============================================
import { useState, useCallback } from 'react';
import { apiClient } from '../api/client';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null) => {
    setLoading(true);
    setError(null);

    try {
      const config = data ? { method, url, data } : { method, url };
      const response = await apiClient(config);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url) => request('GET', url), [request]);
  const post = useCallback((url, data) => request('POST', url, data), [request]);
  const put = useCallback((url, data) => request('PUT', url, data), [request]);
  const del = useCallback((url) => request('DELETE', url), [request]);

  return { loading, error, get, post, put, del };
}