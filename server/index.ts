import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { supabase } from "./supabase";
import { storage } from "./storage"; 
import { SupabaseStorage, initSupabaseTables } from "./supabase-storage";
import fs from "fs";
import path from "path";
import cors from "cors";

// Carica variabili d'ambiente dal file .env se esiste (per ambiente locale)
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('[Config] Loading environment variables from .env file');
    const envConfig = fs.readFileSync(envPath, 'utf8')
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.split('=').map(part => part.trim()));
    
    for (const [key, value] of envConfig) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
} catch (err) {
  console.warn('[Config] Error loading .env file, will use existing environment variables', err);
}

// Verifica che le variabili d'ambiente necessarie siano presenti
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`[Config] Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('[Config] Please create a .env file in the project root with the missing variables');
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Utilizziamo il middleware cors invece della configurazione manuale
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://gamemastercontrol.vercel.app', // Rimosso lo slash finale
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    // Consenti richieste senza origin (come mobile app o Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
      const { data, error } = await supabase.from('users').select('*').limit(1);
      
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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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
