// src/utils/videoEmbed.js
// Utility functions for converting video URLs to embeddable format

/**
 * Convert a video URL to an embeddable iframe URL
 * Supports: YouTube, Vimeo, Google Drive
 */
export function getEmbedUrl(url) {
    if (!url) return null;
    
    try {
      // YouTube patterns
      const youtubePatterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
        /youtube\.com\/embed\/([^&\s]+)/
      ];
      
      for (const pattern of youtubePatterns) {
        const match = url.match(pattern);
        if (match) {
          const videoId = match[1];
          // Add parameters to disable downloads and enforce viewing on site
          return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&disablekb=1`;
        }
      }
      
      // Vimeo pattern
      const vimeoPattern = /vimeo\.com\/(\d+)/;
      const vimeoMatch = url.match(vimeoPattern);
      if (vimeoMatch) {
        const videoId = vimeoMatch[1];
        return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
      }
      
      // Google Drive pattern
      const drivePatterns = [
        /drive\.google\.com\/file\/d\/([^/]+)/,
        /drive\.google\.com\/open\?id=([^&\s]+)/
      ];
      
      for (const pattern of drivePatterns) {
        const match = url.match(pattern);
        if (match) {
          const fileId = match[1];
          return `https://drive.google.com/file/d/${fileId}/preview`;
        }
      }
      
      // If already an embed URL, return as is
      if (url.includes('/embed/') || url.includes('player.vimeo.com') || url.includes('/preview')) {
        return url;
      }
      
      // Unknown format - return null
      return null;
    } catch (error) {
      console.error('Error parsing video URL:', error);
      return null;
    }
  }
  
  /**
   * Get video platform name from URL
   */
  export function getVideoPlatform(url) {
    if (!url) return 'Unknown';
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'YouTube';
    }
    if (url.includes('vimeo.com')) {
      return 'Vimeo';
    }
    if (url.includes('drive.google.com')) {
      return 'Google Drive';
    }
    
    return 'Unknown';
  }
  
  /**
   * Check if URL is a valid video URL
   */
  export function isValidVideoUrl(url) {
    if (!url) return false;
    return getEmbedUrl(url) !== null;
  }
  
  /**
   * Get video thumbnail URL (for preview)
   */
  export function getVideoThumbnail(url) {
    if (!url) return null;
    
    try {
      // YouTube thumbnail
      const youtubePattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
      const youtubeMatch = url.match(youtubePattern);
      if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
      
      // Vimeo thumbnail requires API call, so we'll skip for now
      // Google Drive doesn't provide direct thumbnail access
      
      return null;
    } catch (error) {
      console.error('Error getting video thumbnail:', error);
      return null;
    }
  }