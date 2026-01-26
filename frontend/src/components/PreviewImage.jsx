// frontend/src/components/PreviewImage.jsx
import { useState, useEffect } from 'react';

// Get API URL with multiple fallback methods
const getApiUrl = () => {
  // Try environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback to localhost
  return 'http://localhost:3002/api';
};

export default function PreviewImage({ 
  previewImage,  // filename only (for courses)
  previewUrl,    // full URL (for files)
  alt, 
  className = "w-full h-48 object-cover",
  fallbackContent = null 
}) {
  const [imageState, setImageState] = useState({ loading: true, error: false, src: null });

  // Determine the image URL to use
  let imageUrl = null;
  if (previewUrl) {
    imageUrl = previewUrl;
  } else if (previewImage) {
    const apiUrl = getApiUrl();
    imageUrl = `${apiUrl}/files/preview/${previewImage}`;
  }

  useEffect(() => {
    if (!imageUrl) {
      setImageState({ loading: false, error: false, src: null });
      return;
    }

    console.log('PreviewImage: Loading image:', imageUrl);
    setImageState({ loading: true, error: false, src: null });

    // Create a new image to test if it loads
    const img = new Image();
    
    img.onload = () => {
      console.log('PreviewImage: Image loaded successfully:', imageUrl);
      setImageState({ loading: false, error: false, src: imageUrl });
    };
    
    img.onerror = (e) => {
      console.error('PreviewImage: Failed to load image:', imageUrl, e);
      setImageState({ loading: false, error: true, src: null });
    };
    
    // Set crossOrigin before src to avoid CORS issues
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  if (imageState.loading) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
        <div className="text-gray-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (imageState.error || !imageState.src) {
    return fallbackContent || (
      <div className={`${className} bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold text-xs p-2`}>
        <div className="text-center">
          <div>{(previewImage || previewUrl) ? '이미지 로드 실패' : '미리보기 없음'}</div>
          {imageUrl && (
            <div className="text-xs mt-1 opacity-75 break-all max-w-full overflow-hidden">
              {imageUrl.length > 50 ? `...${imageUrl.slice(-47)}` : imageUrl}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageState.src}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error('PreviewImage: Image element failed to display:', imageUrl, e);
        setImageState({ loading: false, error: true, src: null });
      }}
      onLoad={() => {
        console.log('PreviewImage: Image element loaded successfully:', imageUrl);
      }}
    />
  );
}