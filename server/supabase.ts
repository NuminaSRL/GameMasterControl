import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://hdguwqhxbqssdtqgilmy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'tua-chiave-api-qui';

console.log('[Supabase] Inizializzazione client...');

// Crea il client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Funzione per verificare la connessione
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('flt_games').select('count').limit(1);
    
    if (error) {
      console.error('[Supabase] Errore di connessione:', error.message);
      return false;
    }
    
    console.log('[Supabase] Connessione verificata con successo');
    return true;
  } catch (err) {
    console.error('[Supabase] Eccezione durante la connessione:', err);
    return false;
  }
}

// Funzione di utilità per formattare le date
export function formatDates<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  for (const key in result) {
    const value = result[key];
    
    if (value && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      // Converte le stringhe di date ISO in oggetti Date
      (result as any)[key] = new Date(value);
    } else if (value && typeof value === 'object') {
      // Ricorsivamente formatta le date negli oggetti annidati
      (result as any)[key] = formatDates(value);
    }
  }
  
  return result;
}

// Funzione di utilità per eseguire query con retry
export async function safeSupabaseQuery<T>(queryFn: () => Promise<{data: T | null, error: any}>) {
  try {
    return await queryFn();
  } catch (error) {
    console.error("[Supabase] Errore nella query:", error);
    return { data: null, error: { message: "Query fallita: " + (error instanceof Error ? error.message : String(error)) } };
  }
}