import { supabase } from '../supabase';
import { DatabaseStorage } from '../storage';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// In authService.ts, change the constructor parameter type
import { IStorage } from '../storage'; // Make sure to import IStorage

// Definisci un'interfaccia per i dati utente
interface UserData {
  email: string;
  password: string;
  clientId: number;
  role: string;
  [key: string]: any; // Per altri campi opzionali
}

export class AuthService {
  private storage: IStorage;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  
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


  // Aggiungi il metodo getUserByEmail
  async getUserByEmail(email: string): Promise<any> {
    console.log(`[AuthService] Getting user by email: ${email}`);
    try {
      return await this.storage.getUserByEmail(email);
    } catch (error) {
      console.error('[AuthService] Error getting user by email:', error);
      return null;
    }
  }
  
  // Aggiungi il metodo createUser
  // Modifica il metodo createUser per usare direttamente l'API di Supabase Auth
  async createUser(userData: UserData): Promise<any> {
    console.log(`[AuthService] Creating user with email: ${userData.email}`);
    try {
      // Crea l'utente direttamente con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true // Conferma automaticamente l'email
      });
      
      if (authError) {
        console.error(`[AuthService] Error creating auth user: ${authError}`);
        throw authError;
      }
      
      console.log(`[AuthService] Created auth user: ${authData.user.id}`);
      
      // Ora crea il profilo associato
      const username = userData.email.split('@')[0]; // Usa la parte prima della @ come username
      
      const profileData = {
        id: authData.user.id,
        username: username,
        role: userData.role || 'user',
        client_id: userData.clientId,
        is_active: true
      };
      
      console.log(`[AuthService] Creating profile with data:`, profileData);
      
      // Usa lo storage per creare il profilo
      const { data: createdProfile, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      
      if (profileError) {
        console.error(`[AuthService] Error creating profile: ${profileError}`);
        // Se fallisce la creazione del profilo, eliminiamo l'utente auth
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw profileError;
      }
      
      console.log(`[AuthService] Created profile for user: ${authData.user.id}`);
      
      // Restituisci i dati dell'utente
      return {
        id: authData.user.id,
        email: authData.user.email,
        username: profileData.username,
        role: profileData.role,
        client_id: profileData.client_id,
        is_active: profileData.is_active,
        is_auth_user: true // Aggiungi questo flag per indicare che è un utente Supabase Auth
      };
    } catch (error) {
      console.error('[AuthService] Error creating user:', error);
      throw error;
    }
  }

  async verifyPassword(user: any, password: string): Promise<boolean> {
    console.log(`[AuthService] Verifica password standard per l'utente: ${user.id}`);
    try {
      // Verifica se l'utente ha una password hashata
      if (!user.password) {
        console.log(`[AuthService] Utente senza password hashata`);
        return false;
      }
      
      // Confronta la password fornita con l'hash memorizzato
      const isValid = await bcrypt.compare(password, user.password);
      
      console.log(`[AuthService] Verifica password: ${isValid ? 'successo' : 'fallita'}`);
      return isValid;
    } catch (error) {
      console.error(`[AuthService] Errore durante la verifica della password:`, error);
      return false;
    }
  }
  
  // Aggiungi il metodo generateToken
  generateToken(user: any): string {
    console.log(`[AuthService] Generating token for user: ${user.id}`);
    try {
      // Crea un payload JWT con i dati essenziali dell'utente
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.clientId || user.client_id
      };
      
      // Genera il token con scadenza a 24 ore
      const token = jwt.sign(payload, this.JWT_SECRET, { expiresIn: '24h' });
      return token;
    } catch (error) {
      console.error('[AuthService] Error generating token:', error);
      throw error;
    }
  }

  async verifySupabasePassword(email: string, password: string): Promise<boolean> {
    console.log(`[AuthService] Verifica password Supabase per l'utente: ${email}`);
    try {
      // Prova direttamente con Supabase Auth
      console.log(`[AuthService] Tentativo di login diretto con Supabase Auth`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error(`[AuthService] Errore login diretto con Supabase:`, error);
        
        // Se il login fallisce, prova a sincronizzare l'utente
        console.log(`[AuthService] Tentativo di sincronizzazione dell'utente: ${email}`);
        const synced = await this.syncUserWithSupabaseAuth(email, password);
        
        if (synced) {
          // Riprova il login dopo la sincronizzazione
          console.log(`[AuthService] Utente sincronizzato, nuovo tentativo di login`);
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (retryError) {
            console.error(`[AuthService] Errore login dopo sincronizzazione:`, retryError);
            return false;
          }
          
          console.log(`[AuthService] Login riuscito dopo sincronizzazione per l'utente: ${email}`);
          return true;
        }
        
        return false;
      }
      
      console.log(`[AuthService] Login diretto con Supabase riuscito per l'utente: ${email}`);
      return true;
    } catch (error) {
      console.error(`[AuthService] Errore durante la verifica della password Supabase:`, error);
      return false;
    }
  }

    // Aggiungi questo metodo per reimpostare la password di un utente esistente
    async resetUserPassword(email: string, newPassword: string): Promise<boolean> {
        console.log(`[AuthService] Reimpostazione password per l'utente: ${email}`);
        try {
          // Ottieni l'ID dell'utente
          const { data, error } = await supabase.auth.admin.listUsers();
          
          if (error) {
            console.error(`[AuthService] Errore nel recupero degli utenti:`, error);
            return false;
          }
          
          const user = data.users.find(u => u.email === email);
          
          if (!user) {
            console.log(`[AuthService] Utente ${email} non trovato in Supabase Auth`);
            return false;
          }
          
          console.log(`[AuthService] Trovato utente con ID: ${user.id}, reimpostazione password...`);
          
          // Aggiorna la password dell'utente
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
          );
          
          if (updateError) {
            console.error(`[AuthService] Errore nella reimpostazione della password:`, updateError);
            return false;
          }
          
          console.log(`[AuthService] Password reimpostata con successo per l'utente: ${email}`);
          return true;
        } catch (error) {
          console.error(`[AuthService] Errore durante la reimpostazione della password:`, error);
          return false;
        }
      }

        // Aggiungi questo metodo per verificare e sincronizzare un utente con Supabase Auth
  async syncUserWithSupabaseAuth(email: string, password: string): Promise<boolean> {
    console.log(`[AuthService] Sincronizzazione utente con Supabase Auth: ${email}`);
    try {
      // Verifica se l'utente esiste in Supabase Auth
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error(`[AuthService] Errore nel recupero degli utenti:`, error);
        return false;
      }
      
      const authUser = data.users.find(u => u.email === email);
      
      // Se l'utente non esiste in Supabase Auth, crealo
      if (!authUser) {
        console.log(`[AuthService] Utente ${email} non trovato in Supabase Auth, creazione...`);
        
        // Ottieni l'utente dal database per avere l'ID
        const dbUser = await this.getUserByEmail(email);
        
        if (!dbUser) {
          console.log(`[AuthService] Utente ${email} non trovato nel database`);
          return false;
        }
        
        // Crea l'utente in Supabase Auth
        const { error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: password,
          user_metadata: { profile_id: dbUser.id },
          email_confirm: true
        });
        
        if (createError) {
          console.error(`[AuthService] Errore nella creazione dell'utente in Supabase Auth:`, createError);
          return false;
        }
        
        console.log(`[AuthService] Utente ${email} creato con successo in Supabase Auth`);
        return true;
      }
      
      // Se l'utente esiste ma non è confermato, confermalo
      if (!authUser.email_confirmed_at) {
        console.log(`[AuthService] Utente ${email} non confermato, conferma...`);
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          authUser.id,
          { email_confirm: true }
        );
        
        if (updateError) {
          console.error(`[AuthService] Errore nella conferma dell'utente:`, updateError);
          return false;
        }
        
        console.log(`[AuthService] Utente ${email} confermato con successo`);
      }
      
      // Reimpostazione della password per sicurezza
      return await this.resetUserPassword(email, password);
    } catch (error) {
      console.error(`[AuthService] Errore durante la sincronizzazione dell'utente:`, error);
      return false;
    }
  }

    // Aggiungi questo metodo per verificare lo stato di conferma di un utente
    async checkUserConfirmationStatus(email: string): Promise<any> {
        console.log(`[AuthService] Verifica stato di conferma per l'utente: ${email}`);
        try {
          // Ottieni tutti gli utenti (limitazione dell'API di Supabase)
          const { data, error } = await supabase.auth.admin.listUsers();
          
          if (error) {
            console.error(`[AuthService] Errore nel recupero degli utenti:`, error);
            return { confirmed: false, error: error.message };
          }
          
          // Cerca l'utente specifico
          const user = data.users.find(u => u.email === email);
          
          if (!user) {
            console.log(`[AuthService] Utente ${email} non trovato in Supabase Auth`);
            return { confirmed: false, error: 'User not found' };
          }
          
          // Controlla lo stato di conferma
          const isConfirmed = !!user.email_confirmed_at;
          
          console.log(`[AuthService] Utente ${email} stato di conferma: ${isConfirmed ? 'Confermato' : 'Non confermato'}`);
          console.log(`[AuthService] Dettagli utente:`, {
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at
          });
          
          return {
            confirmed: isConfirmed,
            user: {
              id: user.id,
              email: user.email,
              email_confirmed_at: user.email_confirmed_at,
              created_at: user.created_at
            }
          };
        } catch (error) {
          console.error(`[AuthService] Errore durante la verifica dello stato di conferma:`, error);
          return { confirmed: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      }
      
      // Aggiungi questo metodo per confermare manualmente un utente
      async confirmUser(email: string): Promise<boolean> {
        console.log(`[AuthService] Conferma manuale dell'utente: ${email}`);
        try {
          // Ottieni l'ID dell'utente
          const { data, error } = await supabase.auth.admin.listUsers();
          
          if (error) {
            console.error(`[AuthService] Errore nel recupero degli utenti:`, error);
            return false;
          }
          
          const user = data.users.find(u => u.email === email);
          
          if (!user) {
            console.log(`[AuthService] Utente ${email} non trovato in Supabase Auth`);
            return false;
          }
          
          // Aggiorna l'utente per confermarlo
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
          );
          
          if (updateError) {
            console.error(`[AuthService] Errore nella conferma dell'utente:`, updateError);
            return false;
          }
          
          console.log(`[AuthService] Utente ${email} confermato con successo`);
          return true;
        } catch (error) {
          console.error(`[AuthService] Errore durante la conferma dell'utente:`, error);
          return false;
        }
      }
  
  // Metodo per il login (presumo che esista già, ma lo includo per completezza)
  async loginUser(email: string, password: string): Promise<{ user: any, token: string } | null> {
    try {
      // Prima tentiamo il login con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (authError) {
        console.log(`[AuthService] Supabase Auth login failed: ${authError.message}`);
        // Se fallisce, potremmo avere un utente legacy
        return this.legacyLoginUser(email, password);
      }
      
      // Login riuscito, recuperiamo i dati del profilo
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        console.log(`[AuthService] User authenticated but profile not found: ${email}`);
        return null;
      }
      
      // Genera un token per l'utente autenticato
      const token = this.generateToken(user);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          clientId: user.client_id
        },
        token
      };
    } catch (error) {
      console.error('[AuthService] Login error:', error);
      return null;
    }
  }
  
  // Metodo per gestire il login legacy (se necessario)
  private async legacyLoginUser(email: string, password: string): Promise<{ user: any, token: string } | null> {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user || !user.password) {
        return null;
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      const token = this.generateToken(user);
      
      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          clientId: user.clientId || user.client_id
        },
        token
      };
    } catch (error) {
      console.error('[AuthService] Legacy login error:', error);
      return null;
    }
  }
  
  // Metodo per verificare un token (utile per middleware di autenticazione)
  async verifyToken(token: string) {
    try {
      // Decodifica il token
      const decoded = jwt.verify(token, this.JWT_SECRET) as jwt.JwtPayload;
      
      // Verifichiamo che decoded contenga un id
      if (!decoded || typeof decoded !== 'object' || !decoded.id) {
        console.error('[AuthService] Invalid token payload:', decoded);
        return null;
      }
      
      // Ottieni l'utente dal database
      const user = await this.getUserById(decoded.id);
      
      // Se l'utente non esiste nel database, restituisci null
      if (!user) {
        console.log('[AuthService] User not found in database:', decoded.id);
        return null;
      }
      
      // Assicurati che l'oggetto utente abbia tutte le proprietà necessarie
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        clientId: user.client_id || user.clientId,
        username: user.username,
        // Se isActive non è definito, impostiamolo a true di default
        isActive: user.isActive !== false
      };
    } catch (error) {
      console.error('[AuthService] Token verification error:', error);
      return null;
    }
  }

  
  
  // Metodo per ottenere un utente per ID
  async getUserById(id: string): Promise<any> {
    try {
      return await this.storage.getUserById(id);
    } catch (error) {
      console.error('[AuthService] Error getting user by ID:', error);
      return null;
    }
  }
}
