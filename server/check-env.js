// Environment variables validation script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[Config] Verifying environment variables...');
console.log('[Config] Current environment:', process.env.NODE_ENV);
console.log('[Config] All env variables:', Object.keys(process.env).join(', '));

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
        console.log(`[Config] Setting ${key} from .env file`);
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

// Fallback per ambiente di sviluppo o quando le variabili non sono disponibili
if (missingSupabase.length > 0) {
  console.warn(`⚠️ Supabase credentials missing: ${missingSupabase.join(', ')}`);
  
  // Default values for development only
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Setting default Supabase credentials for development');
    if (!process.env.SUPABASE_URL) {
      process.env.SUPABASE_URL = 'https://hdguwqhxbqssdtqgilmy.supabase.co';
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ3V3cWh4YnFzc2R0cWdpbG15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDAwNzYxMSwiZXhwIjoyMDU5NTgzNjExfQ.JMMjfy1Vwj4QG_VBSUqlortWzQgcDn-Qod8gEy-l6rQ';
    }
    console.log('✅ Using default Supabase credentials for development');
  } else {
    console.warn('⚠️ Will use mock client or fall back to local database');
  }
} else {
  console.log('✅ Supabase credentials found');
  console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL.substring(0, 10)}...`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...`);
}

// Check DATABASE_URL as fallback
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ No DATABASE_URL found in environment');
  
  // If both Supabase and DATABASE_URL are missing, we'll use a mock or local fallback
  if (missingSupabase.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Using Database Storage with mock or default local connection');
  }
} else {
  console.log('✅ DATABASE_URL found in environment');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 10)}...`);
}

console.log('[Config] Environment verification complete');