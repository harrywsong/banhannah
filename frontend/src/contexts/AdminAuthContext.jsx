// src/contexts/AdminAuthContext.jsx
// SEPARATE authentication system for admin - completely isolated from regular users

import { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, apiEndpoint } from '../config/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminSession, setAdminSession] = useState(null);
  const [loading, setLoading] = useState(true);


  // Load admin session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('adminSession');
    const adminToken = localStorage.getItem('adminToken');
    
    if (savedSession && adminToken) {
      try {
        const session = JSON.parse(savedSession);
        // Verify session is still valid
        if (session.role === 'ADMIN') {
          setAdminSession(session);
        } else {
          // Clear invalid session
          localStorage.removeItem('adminSession');
          localStorage.removeItem('adminToken');
        }
      } catch (err) {
        localStorage.removeItem('adminSession');
        localStorage.removeItem('adminToken');
      }
    }
    setLoading(false);
  }, []);

  const adminLogin = async (email, password) => {
    try {
      const response = await apiRequest(apiEndpoint('auth/login'), {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      let data;
      // Handle non-JSON or error responses (e.g. 429 Too Many Requests)
      if (!response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errJson = await response.json();
          return { success: false, error: errJson.error || JSON.stringify(errJson) };
        }
        const text = await response.text();
        return { success: false, error: text || `HTTP ${response.status}` };
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        return { success: false, error: text || 'Unexpected server response' };
      }

      if (response.ok && data.success) {
        // CRITICAL: Check if user is admin
        if (data.user.role !== 'ADMIN') {
          return { 
            success: false, 
            error: 'Access denied. Admin privileges required.' 
          };
        }

        // Store admin token separately from regular user token
        if (data.token) {
          localStorage.setItem('adminToken', data.token);
          console.log('✅ Admin token stored successfully');
        } else {
          return { 
            success: false, 
            error: 'No authentication token received' 
          };
        }

        // Store admin session (separate from regular user session)
        const session = {
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          loggedInAt: new Date().toISOString()
        };
        
        localStorage.setItem('adminSession', JSON.stringify(session));
        setAdminSession(session);
        
        console.log('✅ Admin login successful:', session);
        return { success: true, session };
      } else {
        return { 
          success: false, 
          error: data.error || 'Login failed' 
        };
      }
    } catch (err) {
      console.error('Admin login error:', err);
      return { 
        success: false, 
        error: 'Cannot connect to server. Please try again.' 
      };
    }
  };

  const adminLogout = async () => {
    try {
      // Clear admin-specific storage
      localStorage.removeItem('adminSession');
      localStorage.removeItem('adminToken');
      
      // Call backend logout
      await apiRequest(apiEndpoint('auth/logout'), { method: 'POST' })
        .catch(err => console.error('Logout error:', err));
      
      setAdminSession(null);
      console.log('✅ Admin logged out successfully');
    } catch (err) {
      console.error('Admin logout error:', err);
      // Force clear even if backend fails
      localStorage.removeItem('adminSession');
      localStorage.removeItem('adminToken');
      setAdminSession(null);
    }
  };

  const value = {
    adminSession,
    adminLogin,
    adminLogout,
    loading,
    isAdmin: !!adminSession && adminSession.role === 'ADMIN'
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}