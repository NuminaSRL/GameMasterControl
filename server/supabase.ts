
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Crea un client Supabase lato server con la service role key
// Questo client ha privilegi elevati e deve essere usato solo lato server
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Verifica se le variabili d'ambiente sono configurate
if (!supabaseUrl || !supabaseKey) {
  console.error('🚨 ERRORE: Supabase URL o Service Role Key mancanti');
  console.error('Per utilizzare Supabase, aggiungi queste variabili in Railway:');
  console.error('SUPABASE_URL=https://tuo-progetto.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=supabase_service_role_key');
  console.error('In alternativa, configura solo DATABASE_URL per usare PostgreSQL locale');
}

// Crea un singolo client per l'intera applicazione lato server
// Usiamo temporaneamente 'any' per i tipi, in attesa di generare i tipi corretti da Supabase
export let supabase: SupabaseClient;

try {
  supabase = createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  console.log('[Supabase] Client inizializzato');
} catch (err) {
  console.error('[Supabase] Errore durante l\'inizializzazione del client:', err);
  throw new Error('Impossibile inizializzare il client Supabase. Verifica le variabili d\'ambiente.');
}

// Funzione di utility per convertire array di oggetti in oggetti indicizzati per ID
export function indexById<T extends { id: number }>(items: T[]): Record<number, T> {
  return items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<number, T>);
}

// Funzione di utility per formattare le date ISO in oggetti Date
export function formatDates<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;

  const newObj = { ...obj } as any;
  
  for (const key in newObj) {
    const value = newObj[key];
    
    // Verifica se è una string ISO date
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(value)) {
      newObj[key] = new Date(value);
    } else if (value && typeof value === 'object') {
      // Ricorsione per gli oggetti annidati
      newObj[key] = formatDates(value);
    }
  }
  
  return newObj as T;
}
