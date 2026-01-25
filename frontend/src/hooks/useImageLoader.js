// frontend/src/hooks/useImageLoader.js
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export function useImageLoader(imageUrl) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setLoading(false);
      return;
    }

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);
        
        // Extract the filename from the full URL
        const filename = imageUrl.split('/').pop();
        
        // Use API client to fetch the image as blob
        const response = await apiClient.get(`/files/preview/${filename}`, {
          responseType: 'blob'
        });
        
        // Create blob URL
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        
        setBlobUrl(url);
      } catch (err) {
        console.error('Failed to load image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Cleanup blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [imageUrl]);

  return { blobUrl, loading, error };
}