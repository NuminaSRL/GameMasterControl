import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[Transformer] Avvio del transformer...');

// Crea la directory dist se non esiste
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('[Transformer] Creazione directory dist...');
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('[Transformer] Transformer completato con successo!');