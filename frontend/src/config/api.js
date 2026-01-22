// src/config/api.js

// API Configuration with improved security

// Environment-based API URL configuration
const isDevelopment = import.meta.env.MODE === 'development';
const isProduction = import.meta.env.MODE === 'production';

// Get API URL from environment variable
export const API_URL = import.meta.env.VITE_API_URL || 
  (isDevelopment ? 'http://localhost:3002' : 'https://api.banhannah.dpdns.org');

// Environment info (useful for debugging)
export const ENV = {
  mode: import.meta.env.MODE,
  isDevelopment,
  isProduction,
  apiUrl: API_URL
};

// Log environment info in development
if (isDevelopment) {
  console.log('🔧 Development Mode');
  console.log('📡 API URL:', API_URL);
}

// Helper function to build API endpoints
export const apiEndpoint = (path) => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // If API_URL is empty (dev), return a relative path that will be proxied by Vite.
  return `${API_URL}/api/${cleanPath}`;
};

// ========== THIS IS THE NEW FUNCTION THAT WAS MISSING ==========
// Helper to add authentication headers to XMLHttpRequest (for file uploads)
export const addAuthHeaders = (xhr) => {
  const token = localStorage.getItem('token');
  
  // Add standard headers
  xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
  
  // Add Authorization header if token exists
  if (token) {
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  }
};
// ========== END OF NEW FUNCTION ==========

// Helper function to make API requests with authentication (for fetch)
export const apiRequest = async (url, options = {}) => {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Default headers
  const defaultHeaders = {
    'ngrok-skip-browser-warning': 'true'
  };
  
  // Add Authorization header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  // Only add Content-Type for non-FormData requests
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
  const mergedOptions = {
    ...options,
    credentials: 'include', // Important for cookies
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(url, mergedOptions);
    
    // Handle 401 Unauthorized - clear token and redirect to login
    if (response.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/administrative')) {
        window.location.href = '/login';
      }
    }
    
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Helper to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    return error.response.data?.error || 'An error occurred';
  } else if (error.request) {
    // Request made but no response
    return 'No response from server. Please check your connection.';
  } else {
    // Other errors
    return error.message || 'An unexpected error occurred';
  }
};