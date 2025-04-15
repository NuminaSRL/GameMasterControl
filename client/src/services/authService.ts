import { apiRequest } from '@/lib/queryClient';

// Definisci l'interfaccia User
interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  clientId?: number;
  isActive: boolean;
}

class AuthService {
  // Metodo per effettuare il login
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      console.log('AuthService: Attempting login for', email);
      const response = await apiRequest<{ token: string; user: User }>(
        '/api/auth/login',
        'POST',
        { email, password }
      );
      
      console.log('AuthService: Login successful, saving token');
      // Salva il token nel localStorage
      localStorage.setItem('authToken', response.token);
      
      // Salva anche i dati dell'utente per un accesso più rapido
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response;
    } catch (error) {
      console.error('AuthService: Login error:', error);
      throw error;
    }
  }

  // Metodo per registrare un nuovo utente
  async register(username: string, email: string, password: string, clientId?: number): Promise<void> {
    try {
      console.log('AuthService: Registering new user', email);
      await apiRequest<{ success: boolean }>(
        '/api/auth/register',
        'POST',
        { username, email, password, clientId }
      );
    } catch (error) {
      console.error('AuthService: Registration error:', error);
      throw error;
    }
  }

  // Metodo per effettuare il logout
  logout(): void {
    console.log('AuthService: Logging out user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login'; // Forza il reindirizzamento al login
  }

  // Metodo per verificare se l'utente è autenticato
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  // Metodo per ottenere il token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Metodo per ottenere l'utente corrente
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('AuthService: Error parsing user data:', error);
      return null;
    }
  }

  // Metodo per ottenere il profilo utente dal server
  // Modifica il metodo getUserProfile per gestire meglio gli errori
  async getUserProfile() {
    try {
      console.log('AuthService: Fetching user profile');
      // Verifica se abbiamo un token
      const token = this.getToken();
      if (!token) {
        console.log('AuthService: No token available, cannot fetch profile');
        return null;
      }
      
      console.log('AuthService: Token being used:', token.substring(0, 10) + '...');
      
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error('AuthService: Error fetching profile, status:', response.status);
        
        // Per errori 403, proviamo a leggere il corpo della risposta per ottenere più dettagli
        if (response.status === 403) {
          try {
            const errorData = await response.json();
            console.error('AuthService: Forbidden error details:', errorData);
          } catch (e) {
            console.error('AuthService: Could not parse error response:', e);
          }
          
          // Proviamo anche a verificare se il token è formattato correttamente
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
              console.error('AuthService: Token format is invalid, not a standard JWT');
            } else {
              console.log('AuthService: Token format appears valid (has 3 parts)');
              // Decodifichiamo il payload per vedere se contiene informazioni utili
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('AuthService: Token payload:', payload);
            }
          } catch (e) {
            console.error('AuthService: Error analyzing token:', e);
          }
          
          // Utilizziamo i dati in cache come fallback
          const cachedUser = this.getCurrentUser();
          if (cachedUser) {
            console.log('AuthService: Using cached user data due to 403 error');
            return cachedUser;
          }
        }
        
        if (response.status === 401) {
          // Token non valido, facciamo logout
          this.logout();
          return null;
        }
        
        throw new Error(`Error fetching profile: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log('AuthService: Profile data received:', userData);
      
      // Aggiorna i dati dell'utente nel localStorage
      localStorage.setItem('user', JSON.stringify(userData.user));
      
      return userData.user;
    } catch (error) {
      console.error('AuthService: Error fetching user profile:', error);
      
      // In caso di errore, proviamo a recuperare i dati utente dal localStorage
      const cachedUser = this.getCurrentUser();
      if (cachedUser) {
        console.log('AuthService: Fallback to cached user data');
        return cachedUser;
      }
      
      return null;
    }
  }

  // Metodo per verificare se il token è valido
  isTokenValid(): boolean {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }
    
    try {
      // Decodifica il token JWT per verificare la scadenza
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const { exp } = JSON.parse(jsonPayload);
      
      // Verifica se il token è scaduto
      return Date.now() < exp * 1000;
    } catch (error) {
      console.error('AuthService: Error validating token:', error);
      return false;
    }
  }
}

// Esporta un'istanza singleton del servizio
export default new AuthService();