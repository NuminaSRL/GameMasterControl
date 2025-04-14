import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

// Define user type based on your schema
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  clientId?: number;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, clientId?: number) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  console.log('AuthProvider initializing');

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication...');
      try {
        const token = localStorage.getItem('authToken');
        console.log('Token found:', !!token);
        if (token) {
          console.log('Fetching user profile...');
          const userData = await apiRequest<{ user: User }>('/api/auth/profile');
          console.log('User data received:', userData);
          setUser(userData.user);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        localStorage.removeItem('authToken');
      } finally {
        console.log('Authentication check complete, setting isLoading to false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest<{ token: string; user: User }>(
        '/api/auth/login',
        'POST',
        { email, password }
      );
      
      localStorage.setItem('authToken', response.token);
      setUser(response.user);
      setLocation('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, clientId?: number) => {
    try {
      await apiRequest<{ success: boolean }>(
        '/api/auth/register',
        'POST',
        { username, email, password, clientId }
      );
      
      // After registration, log the user in
      await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setLocation('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};