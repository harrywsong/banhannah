// API Configuration
// This file manages the API endpoint URL for the backend server

// Determine API URL based on environment
const getApiUrl = () => {
  // Check for environment variable (set in build process)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Development: use local backend if running, otherwise use production
  if (import.meta.env.DEV) {
    // Check if backend is running locally
    // You can change this to your Raspberry Pi IP during development
    return 'http://localhost:3001';
  }
  
  // Production: use your Raspberry Pi URL
  // Set VITE_API_URL environment variable in Netlify
  // Examples:
  // - http://your-raspberry-pi-ip:3001 (local network)
  // - http://yourname.duckdns.org:3001 (dynamic DNS)
  // - https://yourdomain.com (with domain)
  return 'http://localhost:3001'; // Fallback - should use VITE_API_URL env var
};

export const API_URL = getApiUrl();

// Helper function to build API endpoints
export const apiEndpoint = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Prepend /api to all endpoints
  return `${API_URL}/api/${cleanPath}`;
};
