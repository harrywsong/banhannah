/**
 * Build a preview image URL from a filename or existing URL
 * @param {string} previewImage - Either a filename or a full URL
 * @returns {string|null} - The complete URL to display the image
 */
export function buildPreviewUrl(previewImage) {
  if (!previewImage) return null;
  
  // If it's already a full URL, return it as-is
  if (previewImage.startsWith('http://') || previewImage.startsWith('https://')) {
    return previewImage;
  }
  
  // Extract just the filename (in case it has path separators)
  const cleanFilename = previewImage.split('/').pop();
  
  // Build the full URL using the API base URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  return `${API_URL}/api/files/view/${encodeURIComponent(cleanFilename)}`;
}