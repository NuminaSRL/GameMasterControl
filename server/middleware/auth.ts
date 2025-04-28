import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import jwt from 'jsonwebtoken';

// Estendi l'interfaccia Request per includere l'utente e il client
declare global {
  namespace Express {
    interface Request {
      user?: any;
      client?: any;
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
      
      // Aggiungiamo log per debug
      console.log('[Auth Middleware] User from token:', user);
      
      // Verifica se l'utente è attivo, ma solo se la proprietà esiste
      // Modifichiamo questa condizione per evitare il 403
      if (user.isActive === false) {
        console.log('[Auth Middleware] User account is disabled:', user.id);
        return res.status(403).json({ message: 'User account is disabled' });
      }
      
      // Aggiungi l'utente alla richiesta
      req.user = user;
      
      next();
    } catch (error) {
      console.error('[Auth Middleware] Authentication error:', error);
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

// Middleware per verificare l'autenticazione del client (server-to-server)
export const verifyClientToken = (req: Request, res: Response, next: NextFunction) => {
  console.log('[Auth Middleware] Verifica token client');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth Middleware] Token mancante o formato non valido');
    return res.status(401).json({ error: 'Token di autenticazione mancante' });
  }
  
  const token = authHeader.split(' ')[1];
  console.log('[Auth Middleware] Token ricevuto', token.substring(0, 10) + '...');
  
  try {
    let decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Se decoded è una stringa, convertiamolo in oggetto
    if (typeof decoded === 'string') {
      try {
        console.log('[Auth Middleware] Decoded è una stringa, tento la conversione in oggetto');
        decoded = JSON.parse(decoded);
      } catch (parseError) {
        console.error('[Auth Middleware] Errore parsing token:', parseError);
        return res.status(403).json({ error: 'Token non valido: formato non corretto' });
      }
    }
    
    console.log('[Auth Middleware] Token decodificato:', decoded);
    
    // Verifica che il token sia di tipo client
    if (typeof decoded === 'object' && decoded !== null && 'type' in decoded) {
      if (decoded.type !== 'client') {
        console.log('[Auth Middleware] Token non di tipo client:', decoded.type);
        return res.status(403).json({ error: 'Token non valido per l\'accesso client' });
      }
      
      // Aggiungi le informazioni del client alla richiesta
      req.client = decoded;
      console.log('[Auth Middleware] Client autenticato:', req.client);
      next();
    } else {
      console.log('[Auth Middleware] Token senza campo type');
      return res.status(403).json({ error: 'Token non valido: formato non corretto' });
    }
  } catch (error) {
    console.error('[Auth Middleware] Errore verifica token:', error);
    return res.status(401).json({ error: 'Token non valido o scaduto' });
  }
};