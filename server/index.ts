import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { supabase } from "./supabase";
import { storage } from "./storage"; 
import { SupabaseStorage, initSupabaseTables } from "./supabase-storage";
import fs from "fs";
import path from "path";

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
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`[Config] Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('[Config] Please create a .env file in the project root with the missing variables');
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurazione CORS per consentire richieste cross-origin dal frontend
app.use((req, res, next) => {
  // Imposta gli header CORS
  const allowedOrigins = [
    'https://gamemastercontrol.vercel.app/', // Sostituire con il tuo dominio Vercel
    'http://localhost:3000',                 // Per sviluppo locale
    'http://localhost:5000'                  // Per sviluppo monolitico
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Consenti a tutti in produzione - da restringere in base ai tuoi requisiti
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Gestisci le richieste OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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

      log(logLine);
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
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
