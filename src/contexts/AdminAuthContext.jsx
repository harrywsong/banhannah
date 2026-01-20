// src/contexts/AdminAuthContext.jsx
// SEPARATE authentication system for admin - completely isolated from regular users

import { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminSession, setAdminSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://api.banhannah.dpdns.org'

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
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

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
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(err => console.error('Logout error:', err));
      
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