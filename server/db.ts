import { supabase } from './supabase';

// Interfaccia semplificata per eseguire query SQL con Supabase
export const db = {
  async execute(query: string, params?: any[]) {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: query,
      params: params || []
    });
    
    if (error) throw error;
    return data;
  }
};

// Funzione di utilità per costruire query SQL parametrizzate
export function sql(strings: TemplateStringsArray, ...values: any[]) {
  return {
    text: strings.reduce((prev, curr, i) => {
      return i === 0 ? curr : prev + '$' + (i) + curr;
    }, ''),
    values
  };
}

// Questa implementazione è utilizzata quando si passa da Drizzle a Supabase
// Assicurati che la funzione RPC 'execute_sql' sia definita nel tuo progetto Supabase