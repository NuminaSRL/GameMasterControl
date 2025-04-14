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
  async register(req: Request, res: Response) {
    try {
      const { username, email, password, clientId } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email and password are required' });
      }
      
      // Verifica se l'email è già in uso
      const existingUser = await this.storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      // Se è stato fornito un clientId, verifica che esista
      if (clientId) {
        const client = await this.storage.getClientById(clientId);
        if (!client) {
          return res.status(400).json({ message: 'Invalid client ID' });
        }
      }
      
      // Registra l'utente
      const user = await this.authService.registerUser({
        username,
        email,
        password,
        role: 'user', // Ruolo predefinito
        clientId: clientId || null
      });
      
      res.status(201).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  }

  // Login utente
  async login(req: Request, res: Response) {
    try {
      // Valida i dati di input
      const { email, password } = loginSchema.parse(req.body);
      
      // Effettua il login
      const result = await this.authService.loginUser(email, password);
      
      if (!result) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      res.json({
        message: 'Login successful',
        user: result.user,
        token: result.token
      });
    } catch (error) {
      res.status(400).json({ message: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
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