import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Assicuriamoci che la directory dist/shared esista
const sharedDir = path.join(__dirname, 'dist', 'shared');
if (!fs.existsSync(sharedDir)) {
  fs.mkdirSync(sharedDir, { recursive: true });
}

// Copiamo i file dalla cartella shared alla cartella dist/shared
const sourceSharedDir = path.join(__dirname, 'shared');
if (fs.existsSync(sourceSharedDir)) {
  const files = fs.readdirSync(sourceSharedDir);
  files.forEach(file => {
    const sourcePath = path.join(sourceSharedDir, file);
    const destPath = path.join(sharedDir, file);
    fs.copyFileSync(sourcePath, destPath);
  });
}

try {
  await esbuild.build({
    entryPoints: ['routes/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    outfile: 'dist/index.cjs',
    external: [
      'express', 
      'cors', 
      'dotenv', 
      '@supabase/supabase-js',
      'drizzle-orm',
      'ws',
      'postgres'
    ],
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    alias: {
      '@shared': './shared'
    }
  });
  console.log('Build completata con successo!');
} catch (error) {
  console.error('Errore durante la build:', error);
  process.exit(1);
}