import { createClient } from '@supabase/supabase-js';

// Ottieni le variabili d'ambiente
const supabaseUrl = process.env.SUPABASE_URL || 'https://hdguwqhxbqssdtqgilmy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ3V3cWh4YnFzc2R0cWdpbG15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDAwNzYxMSwiZXhwIjoyMDU5NTgzNjExfQ.JMMjfy1Vwj4QG_VBSUqlortWzQgcDn-Qod8gEy-l6rQ';

// Log per debug
console.log('[Supabase] Initializing with URL:', supabaseUrl);
console.log('[Supabase] Service role key present:', !!supabaseKey);

// Crea il client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Funzione per formattare le date nei risultati
export function formatDates(obj: any): any {
  if (!obj) return obj;
  
  const result = { ...obj };
  
  // Converti le stringhe di date in oggetti Date
  for (const key in result) {
    if (typeof result[key] === 'string' && 
        (key.endsWith('_at') || key.endsWith('At')) && 
        /^\d{4}-\d{2}-\d{2}/.test(result[key])) {
      result[key] = new Date(result[key]);
    }
  }
  
  return result;
}

// Verifica la connessione a Supabase
export async function testSupabaseConnection() {
  try {
    console.log('[Supabase] Testing connection...');
    const { data, error } = await supabase.from('clients').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('[Supabase] Connection test failed:', error);
      return false;
    }
    
    console.log('[Supabase] Connection successful! Clients count:', data);
    return true;
  } catch (err) {
    console.error('[Supabase] Connection test error:', err);
    return false;
  }
}

// Esegui il test di connessione all'avvio
testSupabaseConnection();