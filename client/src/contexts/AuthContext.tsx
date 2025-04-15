import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import authService from '@/services/authService';

// Definisci l'interfaccia User
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
  login: (email: string, password: string) => Promise<any>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('AuthProvider initializing');

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication...');
      try {
        // Verifica se c'è un token nel localStorage
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        
        if (token) {
          console.log('Token found, checking validity...');
          
          // Prima controlla se abbiamo già i dati utente in localStorage
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const userData = JSON.parse(userStr);
              console.log('Using cached user data:', userData);
              setUser(userData);
            } catch (e) {
              console.error('Error parsing user data:', e);
            }
          }
          
          // Poi aggiorna i dati dal server se possibile
          try {
            console.log('Fetching fresh user profile...');
            const userData = await authService.getUserProfile();
            if (userData) {
              console.log('User data received:', userData);
              setUser(userData);
            }
          } catch (profileError) {
            console.error('Failed to fetch user profile, using cached data:', profileError);
            // Continuiamo a usare i dati in cache se disponibili
          }
        } else {
          console.log('No token found, user is not authenticated');
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication check error:', error);
        setUser(null);
      } finally {
        console.log('Authentication check complete, setting isLoading to false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await authService.login(email, password);
      
      setUser(response.user);
      console.log('Login successful, user data:', response.user);
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, clientId?: number) => {
    try {
      await authService.register(username, email, password, clientId);
      
      // After registration, log the user in
      await login(email, password);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
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