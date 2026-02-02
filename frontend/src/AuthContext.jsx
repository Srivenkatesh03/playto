import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // User is not authenticated (403/401 errors are expected)
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      const data = await api.login(username, password);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (username, email, password, password2) => {
    try {
      const data = await api.register(username, email, password, password2);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error.response?.data 
        ? Object.entries(error.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n')
        : error.message || 'Registration failed. Please try again.';
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
