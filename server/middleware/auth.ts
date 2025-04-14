import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

// Estendi l'interfaccia Request per includere l'utente
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authMiddleware = (authService: AuthService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ottieni il token dall'header Authorization
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verifica il token con Supabase
      const user = await authService.verifyToken(token);
      if (!user) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      
      // Verifica se l'utente è attivo
      if (!user.isActive) {
        return res.status(403).json({ message: 'User account is disabled' });
      }
      
      // Aggiungi l'utente alla richiesta
      req.user = user;
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
  };
};

// Middleware per verificare il ruolo dell'utente
export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Middleware per verificare il client dell'utente
export const clientMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Se l'utente è admin, può accedere a tutti i client
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Verifica se l'utente appartiene al client specificato nella richiesta
    const requestClientId = req.query.clientId || req.body.clientId;
    if (requestClientId && req.user.clientId !== parseInt(requestClientId as string)) {
      return res.status(403).json({ message: 'Access denied to this client data' });
    }
    
    next();
  };
};