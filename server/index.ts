// Rimuovi l'import duplicato di fetch
import express, { type Request, Response as ExpressResponse, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { supabase } from "./supabase";
import { storage } from "./storage"; 
import { SupabaseStorage, initSupabaseTables } from "./supabase-storage";
import fs from "fs";
import path from "path";
import cors from "cors";
// Importa correttamente node-fetch con i tipi necessari
import nodeFetch, { Response as FetchResponse, Request as FetchRequest } from 'node-fetch';

// Import e configura variabili d'ambiente prima di tutto
import './check-env.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Utilizziamo il middleware cors invece della configurazione manuale
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://gamemastercontrol-dev-numinaai-numina-eda53c60.vercel.app', // Aggiunto https://
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    // Consenti richieste senza origin (come mobile app o Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.error(`Origin ${origin} not allowed by CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Endpoint di health check per Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware per il logging delle richieste API
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`[API] ${logLine}`);
    }
  });

  next();
});

// Aggiungi il middleware di intercettazione PRIMA di registerRoutes
app.use((req, res, next) => {
  // Intercetta le richieste che potrebbero essere dirette a api.feltrinelli.com
  try {
    // Salva il fetch originale
    const originalFetch = global.fetch;
    
    // Definiamo una nuova funzione fetch che intercetta le chiamate
    const newFetch = async function(url: string | URL | FetchRequest, init?: RequestInit) {
      const urlString = typeof url === 'string' ? url : url.toString();
      
      console.log(`[Fetch Interceptor] Intercepting fetch call to: ${urlString}`);
      
      // Intercetta QUALSIASI chiamata a api.feltrinelli.com o che contenga rewards/available
      if (urlString.includes('api.feltrinelli.com') || 
          urlString.includes('/api/rewards/available') || 
          urlString.includes('/api/feltrinelli/rewards')) {
        
        console.log(`[Fetch Interceptor] Redirecting request from ${urlString} to Supabase`);
        
        // Estrai il gameId dalla query string o dal percorso
        let gameId: string | null = null;
        
        try {
          // Prova a estrarre il gameId dall'URL
          if (urlString.includes('game_id=')) {
            const match = urlString.match(/game_id=([^&]+)/);
            if (match) gameId = match[1];
          }
          
          // Se non abbiamo un gameId, usiamo un valore predefinito
          if (!gameId) {
            console.log('[Fetch Interceptor] No gameId found, using default');
            gameId = '00000000-0000-0000-0000-000000000001'; // ID predefinito
          }
          
          console.log(`[Fetch Interceptor] Using gameId: ${gameId}`);
          
          // Usa Supabase per ottenere i rewards
          const { data, error } = await supabase
            .from('flt_rewards')
            .select('*')
            .eq('game_id', gameId)
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('[Fetch Interceptor] Supabase query error:', error);
            // Fallback: restituisci un array vuoto
            return new FetchResponse(JSON.stringify({ success: true, rewards: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Formatta i dati nel formato atteso
          const rewards = data?.map(reward => ({
            id: reward.id,
            name: reward.name,
            description: reward.description,
            image_url: reward.image_url,
            points_required: reward.points_required,
            rank: reward.rank
          })) || [];
          
          console.log(`[Fetch Interceptor] Returning ${rewards.length} rewards`);
          
          // Crea una risposta simulata
          return new FetchResponse(JSON.stringify({ success: true, rewards }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('[Fetch Interceptor] Error processing request:', error);
          // Fallback: restituisci un array vuoto
          return new FetchResponse(JSON.stringify({ success: true, rewards: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Per tutte le altre richieste, usa il fetch originale
      try {
        console.log(`[Fetch Interceptor] Passing through to original fetch: ${urlString}`);
        // Converti l'URL nel formato corretto per originalFetch
        if (url instanceof FetchRequest) {
          return originalFetch(url.url, init);
        } else {
          return originalFetch(url, init);
        }
      } catch (error) {
        console.error('[Fetch Interceptor] Error in original fetch:', error);
        throw error;
      }
    };
    
    // Sostituisci la funzione fetch globale
    global.fetch = newFetch as typeof global.fetch;
    
    // Continua con la richiesta
    next();
    
    // Ripristina il fetch originale dopo che la richiesta è stata gestita
    res.on('finish', () => {
      global.fetch = originalFetch;
    });
  } catch (error) {
    console.error('[Fetch Interceptor] Error setting up fetch interceptor:', error);
    next();
  }
});

// Aggiungi anche un endpoint diretto per /api/feltrinelli/rewards
app.get('/api/feltrinelli/rewards', async (req, res) => {
  try {
    console.log('[API] Direct handler for /api/feltrinelli/rewards');
    
    // Estrai il gameType dalla query o usa un valore predefinito
    const gameType = req.query.gameType as string;
    const gameId = req.query.game_id as string;
    
    console.log(`[API] Request params - gameType: ${gameType}, gameId: ${gameId}`);
    
    let query = supabase
      .from('flt_rewards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    // Se è specificato un gameId specifico, usa quello
    if (gameId) {
      console.log(`[API] Filtering by specific gameId: ${gameId}`);
      query = query.eq('game_id', gameId);
    }
    // Altrimenti, se è specificato un gameType, mappa al gameId corrispondente
    else if (gameType) {
      let mappedGameId = '00000000-0000-0000-0000-000000000001'; // Default: Quiz Libri
      
      // Mappa gameType a gameId
      if (gameType === 'books' || gameType === 'libri') {
        mappedGameId = '00000000-0000-0000-0000-000000000001';
      } else if (gameType === 'authors' || gameType === 'autori') {
        mappedGameId = '00000000-0000-0000-0000-000000000002';
      } else if (gameType === 'years' || gameType === 'anni') {
        mappedGameId = '00000000-0000-0000-0000-000000000003';
      }
      
      console.log(`[API] Mapped gameType ${gameType} to gameId: ${mappedGameId}`);
      query = query.eq('game_id', mappedGameId);
    }
    // Se non è specificato né gameId né gameType, restituisci tutti i premi
    else {
      console.log('[API] No gameId or gameType specified, returning all rewards');
    }
    
    // Esegui la query
    const { data, error } = await query;
    
    if (error) {
      console.error('[API] Supabase query error:', error);
      return res.status(500).json({ message: `Error fetching rewards: ${error.message}` });
    }
    
    // Formatta i dati nel formato atteso
    const rewards = data?.map(reward => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      image_url: reward.image_url,
      points_required: reward.points_required,
      rank: reward.rank,
      type: reward.type || 'merchandise',
      value: reward.value || '',
      icon: reward.icon || 'gift',
      color: reward.color || '#33FFA1',
      available: reward.available || 10,
      game_id: reward.game_id
    })) || [];
    
    console.log(`[API] Returning ${rewards.length} rewards directly`);
    
    // Restituisci i rewards
    return res.status(200).json(rewards);
  } catch (error) {
    console.error('[API] Error handling /api/feltrinelli/rewards:', error);
    return res.status(500).json({ message: `Error fetching rewards: ${error}` });
  }
});

(async () => {
  // Verifica quale storage stiamo utilizzando
  console.log('[Database]', storage instanceof SupabaseStorage 
    ? 'Using Supabase for database connection' 
    : 'Using PostgreSQL for database connection');
  
  // Se stiamo usando Supabase, inizializziamo le tabelle
  if (storage instanceof SupabaseStorage) {
    try {
      // Prima inizializziamo le tabelle
      await initSupabaseTables();
      
      // Poi verifichiamo se la tabella users esiste
      const queryResult = supabase.from('users').select('*').limit(1);
      const { data, error } = await new Promise<{data: any, error: any}>((resolve) => {
        queryResult.then((res: any) => resolve(res));
      });
      
      if (error) {
        console.error('[Supabase] Connection error:', error.message);
      } else {
        console.log('[Supabase] Connection successful, users count:', data.length);
      }
    } catch (err) {
      console.error('[Supabase] Error testing connection:', err);
    }
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: ExpressResponse, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('[Error]', err);
  });

  // ALWAYS serve the app on port 5000 or the PORT environment variable
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`[Server] API server running on port ${port}`);
  });
})();
