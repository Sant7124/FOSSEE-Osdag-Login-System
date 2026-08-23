import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

interface AuthContextType {
  currentUser: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const refreshUser = async () => {
    try {
      // Intentionally request the protected /me route which relies exclusively on the HttpOnly cookie
      const response = await api.get('/me');
      
      if (response.data.status === 'success' && response.data.data.user) {
        setCurrentUser(response.data.data.user);
        setStatus('authenticated');
      } else {
        setCurrentUser(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      // Network error or 401 Unauthorized
      setCurrentUser(null);
      setStatus('unauthenticated');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, status, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
