console.log('[Server] File index.ts caricato');
import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes/index';  // Rimosso .js dall'importazione
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
// Modifica l'importazione
import { configureUploadRoute } from './api/upload';
import { configureRewardGamesRoutes, configureFeltrinelliRewardGamesRoutes } from './api/reward-games';
import debugRoutes from './routes/debug';

// Configurazione per ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica le variabili d'ambiente
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('[Config] Caricamento variabili d\'ambiente da .env');
  dotenv.config({ path: envPath });
} else {
  console.warn('[Config] File .env non trovato');
}

// Verifica configurazione Supabase
console.log('[Supabase] URL:', process.env.SUPABASE_URL ? 'Configurato' : 'Mancante');
console.log('[Supabase] Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurato' : 'Mancante');

console.log('[Server] Importazioni completate');

async function startServer() {
  console.log('[Server] Funzione startServer chiamata');
  try {
    const app = express();
    
    // Middleware essenziali
    app.use(cors());
    app.use(express.json());
    app.use('/api/debug', debugRoutes);
    
    // Configura la route di upload con Supabase
    configureUploadRoute(app);
    
    // Aggiungi questo blocco per configurare i file statici
    const uploadsPath = path.join(process.cwd(), 'public/uploads');
    console.log('[Server] Configurazione percorso uploads:', uploadsPath);
    
    // Creiamo la directory se non esiste
    if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
      console.log('[Server] Creazione directory public');
      fs.mkdirSync(path.join(process.cwd(), 'public'), { recursive: true });
    }
    
    if (!fs.existsSync(uploadsPath)) {
      console.log('[Server] Creazione directory uploads');
      fs.mkdirSync(uploadsPath, { recursive: true });
      try {
        fs.chmodSync(uploadsPath, 0o755);
        console.log('[Server] Permessi impostati per directory uploads');
      } catch (err) {
        console.error('[Server] Errore impostazione permessi:', err);
      }
    }
    
    // Servi file statici da /uploads
    app.use('/uploads', express.static(uploadsPath, {
      fallthrough: false, // Ritorna 404 invece di passare alla prossima route
      etag: true,         // Abilita ETag per cache
      maxAge: '1h',       // Cache per un'ora
    }));
    console.log('[Server] Route statica uploads configurata');
    
    console.log('[Server] Inizializzazione server...');
    
    // Aggiungiamo un endpoint di health check direttamente qui
    app.get('/api/health', (req, res) => {
      console.log('[Health Check] Endpoint chiamato direttamente da index.ts');
      return res.status(200).send('OK');
    });
    
    console.log('[Server] Health check endpoint registrato');
    
    // Configura la route di upload
    configureUploadRoute(app);
    
    // Configure reward-games routes
    configureRewardGamesRoutes(app);
    configureFeltrinelliRewardGamesRoutes(app);
    
    // Registra le route e ottieni il server HTTP
    console.log('[Server] Tentativo di registrare le route...');
    const httpServer = await registerRoutes(app);
    console.log('[Server] Route registrate con successo');
    
    // Avvia il server HTTP su una porta specifica
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`[Server] Server in ascolto sulla porta ${PORT}`);
      console.log(`[Server] Health check disponibile su http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('[Server] Errore durante l\'avvio del server:', error);
    process.exit(1);
  }
}

// Avvia il server
console.log('[Server] Chiamata a startServer()');
startServer();
console.log('[Server] Chiamata a startServer() completata');

// Remove this line as it's now inside the startServer function
// app.use('/api/upload', uploadRouter);