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
    const originalFetch = global.fetch;
    
    // Definiamo una nuova funzione fetch che intercetta le chiamate
    const newFetch = async function(url: string | URL | FetchRequest, init?: RequestInit) {
      const urlString = typeof url === 'string' ? url : url.toString();
      
      // Se la richiesta è diretta a api.feltrinelli.com, reindirizzala a Supabase
      if (urlString.includes('api.feltrinelli.com') || urlString.includes('/api/rewards/available')) {
        console.log(`[API Redirect] Redirecting request from ${urlString} to Supabase`);
        
        // Estrai il gameId e il period dalla query string
        const urlObj = new URL(urlString);
        const gameId = urlObj.searchParams.get('game_id');
        const period = urlObj.searchParams.get('period') || 'all_time';
        
        if (urlString.includes('/api/rewards/available') && gameId) {
          try {
            // Usa Supabase per ottenere i rewards
            const { data, error } = await supabase
              .from('flt_rewards')
              .select('*')
              .eq('game_id', gameId)
              .eq('is_active', true)
              .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Formatta i dati nel formato atteso
            const rewards = data.map(reward => ({
              id: reward.id,
              name: reward.name,
              description: reward.description,
              image_url: reward.image_url,
              points_required: reward.points_required,
              rank: reward.rank
            }));
            
            // Crea una risposta simulata
            const responseBody = JSON.stringify({ success: true, rewards });
            return new FetchResponse(responseBody, {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (error) {
            console.error('[API Redirect] Error fetching rewards from Supabase:', error);
            throw error;
          }
        }
      }
      
      // Per tutte le altre richieste, usa il fetch originale
      // Converti l'URL nel formato corretto per originalFetch
      if (url instanceof FetchRequest) {
        return originalFetch(url.url, init);
      } else {
        return originalFetch(url, init);
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
    console.error('[API Redirect] Error setting up fetch interceptor:', error);
    next();
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
