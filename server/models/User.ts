import { z } from 'zod';

// Schema di validazione per la creazione di un utente
export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'user', 'client']).default('user'),
  clientId: z.number().optional(),
  isActive: z.boolean().default(true)
});

// Schema di validazione per il login
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Tipo per l'utente
export type User = {
  id: number;
  username: string;
  email: string;
  password: string; // Sarà hashata
  role: 'admin' | 'user' | 'client';
  clientId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Tipo per l'utente senza password (per le risposte API)
export type SafeUser = Omit<User, 'password'>;