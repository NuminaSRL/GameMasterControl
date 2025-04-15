import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { createUserSchema, loginSchema } from '../models/User';
import { DatabaseStorage } from '../storage'; // Change to use the existing DatabaseStorage

// In authController.ts, change the constructor parameter type
import { IStorage } from '../storage'; // Make sure to import IStorage

export class AuthController {
  private authService: AuthService;
  private storage: IStorage;

  constructor(authService: AuthService, storage: IStorage) {
    this.authService = authService;
    this.storage = storage;
  }

  // Registrazione utente
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Rimuoviamo username dai campi richiesti
      const { name, email, password, clientId } = req.body;
      
      if (!email || !password || !clientId) {
        res.status(400).json({ message: 'Email, password e clientId sono obbligatori' });
        return;
      }
      
      console.log('[Auth] Tentativo di registrazione con:', { email, clientId });
      
      // Verifica se l'utente esiste già
      const existingUser = await this.authService.getUserByEmail(email);
      
      if (existingUser) {
        res.status(409).json({ message: 'Utente già esistente' });
        return;
      }
      
      // Ottieni informazioni sul client
      const client = await this.storage.getClient(clientId);
      
      if (!client) {
        res.status(404).json({ message: 'Client non trovato' });
        return;
      }
      
      console.log('[Auth] Client trovato per la registrazione:', client);
      
      // Crea l'utente con i campi appropriati
      try {
        const user = await this.authService.createUser({
          email,
          password,
          clientId,
          role: 'user'
        });
        
        const token = this.authService.generateToken(user);
        
        res.status(201).json({ 
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            clientId: user.clientId || user.client_id
          }, 
          token 
        });
      } catch (createError) {
        console.error('[Auth] Errore nella creazione dell\'utente:', createError);
        res.status(500).json({ 
          message: 'Errore nella creazione dell\'utente', 
          details: createError instanceof Error ? createError.message : 'Errore sconosciuto'
        });
      }
    } catch (error) {
      console.error('[Auth] Errore di registrazione:', error);
      res.status(500).json({ 
        message: 'Errore durante la registrazione',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  }

  // Login utente
  async login(req: Request, res: Response) {
    try {
      // Valida i dati di input
      const { email, password } = loginSchema.parse(req.body);
      
      console.log(`[Auth] Tentativo di login per l'utente: ${email}`);
      
      // Ottieni l'utente dal database
      const user = await this.authService.getUserByEmail(email);
      
      if (!user) {
        console.log(`[Auth] Utente non trovato: ${email}`);
        return res.status(401).json({ message: 'Email o password non validi' });
      }
      
      console.log(`[Auth] Utente trovato: ${user.id}, verifico la password`);
      
      // Verifica la password
      let isPasswordValid = false;
      
      // Se l'utente è autenticato tramite Supabase Auth
      if (user.is_auth_user) {
        console.log(`[Auth] Utente Supabase Auth, verifico con Supabase`);
        // Usa il servizio di autenticazione per verificare la password con Supabase
        isPasswordValid = await this.authService.verifySupabasePassword(email, password);
      } else {
        // Utente legacy, usa il metodo standard
        console.log(`[Auth] Utente legacy, verifico con metodo standard`);
        isPasswordValid = await this.authService.verifyPassword(user, password);
      }
      
      if (!isPasswordValid) {
        console.log(`[Auth] Password non valida per l'utente: ${email}`);
        return res.status(401).json({ message: 'Email o password non validi' });
      }
      
      console.log(`[Auth] Login riuscito per l'utente: ${email}`);
      
      // Genera il token
      const token = this.authService.generateToken(user);
      
      // Restituisci i dati dell'utente e il token
      res.json({
        message: 'Login effettuato con successo',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          clientId: user.client_id || user.clientId,
          username: user.username
        },
        token
      });
    } catch (error) {
      console.error(`[Auth] Errore durante il login:`, error);
      res.status(400).json({ 
        message: `Login fallito: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` 
      });
    }
  }

  // Ottieni profilo utente
  async getProfile(req: Request, res: Response) {
    try {
      // L'utente è già disponibile grazie al middleware di autenticazione
      res.json({ user: req.user });
    } catch (error) {
      res.status(500).json({ message: `Error fetching profile: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }
}