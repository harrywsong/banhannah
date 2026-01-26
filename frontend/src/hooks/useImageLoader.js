// frontend/src/hooks/useImageLoader.js
import { useState, useEffect } from 'react';

export function useImageLoader(imageUrl) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setLoading(false);
      return;
    }

    console.log('Loading image:', imageUrl);

    const loadImage = () => {
      setLoading(true);
      setError(false);
      
      // Create a new image element to test loading
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('Image loaded successfully:', imageUrl);
        setBlobUrl(imageUrl);
        setLoading(false);
      };
      
      img.onerror = (e) => {
        console.error('Image failed to load:', imageUrl, e);
        setError(true);
        setLoading(false);
      };
      
      img.src = imageUrl;
    };

    loadImage();

    // Cleanup
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [imageUrl]);

  return { blobUrl, loading, error };
}