import { createClient } from '@supabase/supabase-js';

// Crea un singolo client Supabase per l'intera applicazione
// Legge API key e URL dalle variabili d'ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Variabili d\'ambiente Supabase mancanti. VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY sono necessarie per utilizzare Supabase.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Funzione di utilità per verificare se Supabase è configurato
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseKey);
};
