import { supabase } from '../supabase';
import { DatabaseStorage } from '../storage';

// In authService.ts, change the constructor parameter type
import { IStorage } from '../storage'; // Make sure to import IStorage

export class AuthService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  // Registra un nuovo utente usando Supabase
  async registerUser(userData: { email: string; password: string; username: string; role?: string; clientId?: number }) {
    try {
      // Registra l'utente con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (authError) throw authError;

      // Se la registrazione è andata a buon fine, salva i dati aggiuntivi nel profilo
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            username: userData.username,
            role: userData.role || 'user',
            client_id: userData.clientId || null,
            is_active: true
          });

        if (profileError) throw profileError;

        // Restituisci i dati dell'utente senza la password
        return {
          id: authData.user.id,
          email: authData.user.email,
          username: userData.username,
          role: userData.role || 'user',
          clientId: userData.clientId || null,
          isActive: true
        };
      }
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  // Login utente usando Supabase
  async loginUser(email: string, password: string) {
    try {
      // Effettua il login con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Ottieni i dati del profilo
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        // Verifica se l'utente è attivo
        if (!profileData.is_active) {
          throw new Error('User account is disabled');
        }

        return {
          user: {
            id: data.user.id,
            email: data.user.email,
            username: profileData.username,
            role: profileData.role,
            clientId: profileData.client_id,
            isActive: profileData.is_active
          },
          token: data.session.access_token
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  // Verifica token JWT di Supabase
  async verifyToken(token: string) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) return null;
      
      if (data.user) {
        // Ottieni i dati del profilo
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) return null;

        // Verifica se l'utente è attivo
        if (!profileData.is_active) {
          return null;
        }

        return {
          id: data.user.id,
          email: data.user.email,
          username: profileData.username,
          role: profileData.role,
          clientId: profileData.client_id,
          isActive: profileData.is_active
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error verifying token:', error);
      return null;
    }
  }

  // Ottieni utente per ID
  async getUserById(id: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;

      return {
        id,
        username: data.username,
        email: data.email,
        role: data.role,
        clientId: data.client_id,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}