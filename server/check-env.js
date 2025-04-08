
// Environment variables validation script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[Config] Verifying environment variables...');

// Check if .env file exists
try {
  const envPath = path.join(__dirname, '.env');
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

// Required environment variables for Supabase
const requiredForSupabase = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingSupabase = requiredForSupabase.filter(varName => !process.env[varName]);

if (missingSupabase.length > 0) {
  console.warn(`⚠️ Supabase credentials missing: ${missingSupabase.join(', ')}`);
  console.warn('⚠️ Will use mock client or fall back to local database');
} else {
  console.log('✅ Supabase credentials found');
}

// Check DATABASE_URL as fallback
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ No DATABASE_URL found in environment');
  
  // If both Supabase and DATABASE_URL are missing, we'll use a mock or local fallback
  if (missingSupabase.length > 0) {
    console.warn('⚠️ Using Database Storage with mock or default local connection');
  }
} else {
  console.log('✅ DATABASE_URL found in environment');
}

console.log('[Config] Environment verification complete');
