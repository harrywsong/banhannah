// frontend/src/utils/helpers.js
// ============================================
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Robustly trigger a file download using authenticated API call
 */
export async function triggerDownload(url, filename) {
  try {
    console.log('triggerDownload called with:', { url, filename });
    
    // Import apiClient dynamically to avoid circular imports
    const { apiClient } = await import('../api/client.js');
    
    // Clean up the URL - handle various URL formats
    let cleanUrl = url;
    
    // Remove any protocol and host parts
    cleanUrl = cleanUrl.replace(/https?:\/\/[^\/]+/, '');
    
    // Remove port numbers and extra characters after colons
    cleanUrl = cleanUrl.split(':')[0];
    
    // Remove duplicate /api prefixes
    while (cleanUrl.includes('/api/api')) {
      cleanUrl = cleanUrl.replace('/api/api', '/api');
    }
    
    // Remove /api prefix since apiClient already has it in baseURL
    if (cleanUrl.startsWith('/api/')) {
      cleanUrl = cleanUrl.substring(4); // Remove '/api'
    }
    
    // Ensure it starts with /
    if (!cleanUrl.startsWith('/')) {
      cleanUrl = '/' + cleanUrl;
    }
    
    console.log('Cleaned URL:', cleanUrl);
    
    // Make authenticated request to get the file
    const response = await apiClient.get(cleanUrl, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/octet-stream'
      }
    });

    console.log('Download response received:', response.status, response.headers);

    // Create blob URL and trigger download
    const blob = new Blob([response.data]);
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename || 'download');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    URL.revokeObjectURL(blobUrl);
    
    console.log('Download completed successfully');
  } catch (error) {
    console.error('Download failed:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    alert('다운로드에 실패했습니다: ' + (error.response?.data?.error || error.message));
  }
}
