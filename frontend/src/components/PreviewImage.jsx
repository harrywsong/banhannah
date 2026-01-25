// frontend/src/components/PreviewImage.jsx
import { useImageLoader } from '../hooks/useImageLoader';

export default function PreviewImage({ 
  previewImage,  // filename only (for courses)
  previewUrl,    // full URL (for files)
  alt, 
  className = "w-full h-48 object-cover",
  fallbackContent = null 
}) {
  // Determine the image URL to use
  let imageUrl = null;
  if (previewUrl) {
    imageUrl = previewUrl;
  } else if (previewImage) {
    imageUrl = `${import.meta.env.VITE_API_URL}/files/preview/${previewImage}`;
  }

  const { blobUrl, loading, error } = useImageLoader(imageUrl);

  if (loading) {
    return (
      <div className={`${className} bg-gray-200 animate-pulse flex items-center justify-center`}>
        <div className="text-gray-400 text-sm">로딩 중...</div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return fallbackContent || (
      <div className={`${className} bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold`}>
        {(previewImage || previewUrl) ? '이미지 로드 실패' : '미리보기 없음'}
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={className}
      onError={() => {
        // Additional error handling if blob URL fails
        console.error('Blob URL failed for image:', previewImage || previewUrl);
      }}
    />
  );
}