import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('therapist_token');
      const storedUser = localStorage.getItem('therapist_user');

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid
          const data = await authAPI.verify();
          if (data.ok) {
            setUser(data.user);
          } else {
            localStorage.removeItem('therapist_token');
            localStorage.removeItem('therapist_user');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('therapist_token');
          localStorage.removeItem('therapist_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authAPI.login(username, password);

      if (!data.ok) {
        return { success: false, error: data.message || 'Login failed' };
      }

      localStorage.setItem('therapist_token', data.token);
      localStorage.setItem('therapist_user', JSON.stringify(data.user));
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData);

      if (!data.ok) {
        return { success: false, error: data.message || 'Registration failed' };
      }

      localStorage.setItem('therapist_token', data.token);
      localStorage.setItem('therapist_user', JSON.stringify(data.user));
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('therapist_token');
    localStorage.removeItem('therapist_user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
