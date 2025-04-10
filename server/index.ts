console.log('[Server] File index.ts caricato');
import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes/index';  // Rimosso .js dall'importazione
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

console.log('[Server] Importazioni completate');

async function startServer() {
  console.log('[Server] Funzione startServer chiamata');
  try {
    const app = express();
    
    // Middleware essenziali
    app.use(cors());
    app.use(express.json());
    
    console.log('[Server] Inizializzazione server...');
    
    // Aggiungiamo un endpoint di health check direttamente qui
    app.get('/api/health', (req, res) => {
      console.log('[Health Check] Endpoint chiamato direttamente da index.ts');
      return res.status(200).send('OK');
    });
    
    console.log('[Server] Health check endpoint registrato');
    
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