import { supabase } from './supabase';

// Interfaccia semplificata per eseguire query SQL con Supabase
export const db = {
  async execute(query: string, params?: any[]) {
    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: query,
        params: params || []
      });
      
      if (error) {
        console.error('Error executing SQL:', error);
        throw error;
      }
      
      // Assicuriamoci che il risultato abbia la struttura attesa
      return {
        rows: Array.isArray(data) ? data : (data?.rows || []),
        rowCount: Array.isArray(data) ? data.length : (data?.rowCount || 0)
      };
    } catch (error) {
      console.error('Error in db.execute:', error);
      throw error;
    }
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
// La funzione RPC 'execute_sql' deve essere definita nel tuo progetto Supabase