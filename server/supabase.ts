import { createClient } from '@supabase/supabase-js';

// Verifica se le variabili d'ambiente sono disponibili
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Crea un client mock se le credenziali non sono disponibili
let supabaseClient;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Credenziali Supabase mancanti. Utilizzo client mock o fallback a database locale.');
  
  // Funzione helper per creare metodi concatenabili
  const createChainableMock = () => {
    const mock = {
      select: () => mock,
      insert: () => mock,
      update: () => mock,
      delete: () => mock,
      eq: () => mock,
      neq: () => mock,
      gt: () => mock,
      lt: () => mock,
      gte: () => mock,
      lte: () => mock,
      like: () => mock,
      ilike: () => mock,
      is: () => mock,
      in: () => mock,
      contains: () => mock,
      containedBy: () => mock,
      range: () => mock,
      overlaps: () => mock,
      textSearch: () => mock,
      filter: () => mock,
      not: () => mock,
      or: () => mock,
      and: () => mock,
      order: () => mock,
      limit: () => mock,
      offset: () => mock,
      single: () => ({ data: null, error: { message: 'Supabase non configurato' } }),
      maybeSingle: () => ({ data: null, error: { message: 'Supabase non configurato' } }),
      then: (callback: any) => Promise.resolve({ data: null, error: { message: 'Supabase non configurato' } }).then(callback)
    };
    return mock;
  };
  
  // Crea un client mock che non fa nulla ma non causa errori
  supabaseClient = {
    from: () => createChainableMock(),
    rpc: () => ({ data: null, error: { message: 'Supabase non configurato' } }),
    auth: {
      signIn: () => Promise.resolve({ user: null, session: null, error: { message: 'Supabase non configurato' } }),
      signOut: () => Promise.resolve({ error: { message: 'Supabase non configurato' } })
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase non configurato' } }),
        download: () => Promise.resolve({ data: null, error: { message: 'Supabase non configurato' } }),
        remove: () => Promise.resolve({ data: null, error: { message: 'Supabase non configurato' } }),
        list: () => Promise.resolve({ data: null, error: { message: 'Supabase non configurato' } })
      })
    }
  };
} else {
  // Crea il client Supabase reale se le credenziali sono disponibili
  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export const supabase = supabaseClient;

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