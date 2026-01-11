// API Configuration
// This file manages the API endpoint URL for the backend server

// Determine API URL based on environment
const getApiUrl = () => {
  // Check for environment variable (set in build process or .env.local for development)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Default: Use Raspberry Pi backend (same for dev and production)
  // Update this URL if your ngrok URL changes
  return 'https://nichol-tunnellike-constrictively.ngrok-free.dev';
};

export const API_URL = getApiUrl();

// Helper function to build API endpoints
export const apiEndpoint = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Prepend /api to all endpoints
  return `${API_URL}/api/${cleanPath}`;
};
