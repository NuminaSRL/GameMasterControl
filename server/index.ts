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
import { configureRewardGamesRoutes } from './api/reward-games'; 
import { configureClientRewardsRoutes } from './api/client-rewards'; // Aggiungi questa importazione
import debugRoutes from './routes/debug';
// Importa il router Feltrinelli
import feltrinelliRouter from './clients/feltrinelli/routes/index';
import { configureLeaderboardRoutes } from './api/leaderboard';
// Importa il router di autenticazione
import authRouter from './api/auth';
import gamesRouter from './api/games';
// Importa il router per i premi dei giochi Feltrinelli
import feltrinelliGameRewardRoutes from './clients/feltrinelli/routes/game-reward-routes';

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
    
    // Monta il router di autenticazione
    app.use('/api', authRouter);
    app.use('/api', gamesRouter);
    console.log('[Server] Router di autenticazione montato su /api');
    
    // Configura la route di upload con Supabase
    configureUploadRoute(app);

    configureLeaderboardRoutes(app);
    
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

    console.log('[Server] Montaggio router Feltrinelli su /api/feltrinelli');
app.use('/api/feltrinelli', feltrinelliRouter);

// Aggiungi un log per tutte le rotte registrate
console.log('[Server] Rotte registrate:');
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    // Rotte dirette
    console.log(`[Server] Rotta: ${middleware.route.path}, Metodi: ${Object.keys(middleware.route.methods)}`);
  } else if (middleware.name === 'router') {
    // Router montati
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        console.log(`[Server] Router: ${middleware.regexp}, Rotta: ${handler.route.path}, Metodi: ${Object.keys(handler.route.methods)}`);
      }
    });
  }
});
    
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
    
    // Aggiungiamo un endpoint di test per l'autenticazione
    app.get('/api/auth-test-direct', (req, res) => {
      console.log('[Auth Test] Endpoint chiamato direttamente da index.ts');
      return res.json({ message: 'Auth test endpoint is working' });
    });
    
    // Aggiungiamo un endpoint di test diretto per l'autenticazione
    app.post('/api/direct-auth-test', (req, res) => {
      console.log('[Direct Auth Test] Richiesta ricevuta:', req.body);
      return res.json({ 
        message: 'Direct auth test endpoint is working',
        receivedData: req.body
      });
    });
    
    console.log('[Server] Health check endpoint registrato');
    
    // Configura la route di upload
    configureUploadRoute(app);
    
    // Configure reward-games routes
    configureRewardGamesRoutes(app);
    
    // Configure client rewards routes (nuovo endpoint dedicato)
    configureClientRewardsRoutes(app);
    
    // Aggiungi il router per i premi dei giochi Feltrinelli
    app.use('/api', feltrinelliGameRewardRoutes);
    
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

// Remove these lines as they're now inside the startServer function
// app.use('/api/upload', uploadRouter);
// app.use('/api', feltrinelliGameRewardRoutes);
