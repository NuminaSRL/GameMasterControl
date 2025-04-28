import { supabase } from './supabase';

// Interfaccia semplificata per eseguire query SQL con Supabase
export const db = {
  // Metodo per eseguire query SQL tramite RPC
  async execute(query: string, params?: any[]) {
    try {
      // Assicuriamoci che i parametri siano in un formato valido per JSON
      const safeParams = params ? params.map(p => {
        if (p === undefined) return null;
        return p;
      }) : [];
      
      // Per operazioni di lettura semplici, usa direttamente le API di Supabase
      if (query.trim().toLowerCase().startsWith('select') && !query.includes('join')) {
        return await this.executeSelect(query, safeParams);
      }
      
      // Per operazioni più complesse, usa RPC
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: query,
        params: safeParams
      });
      
      if (error) {
        console.error('Error executing SQL via RPC:', error);
        throw error;
      }
      
      return {
        rows: Array.isArray(data) ? data : (data?.rows || []),
        rowCount: Array.isArray(data) ? data.length : (data?.rowCount || 0)
      };
    } catch (error) {
      console.error('Error in db.execute:', error);
      throw error;
    }
  },
  
  // Metodo per eseguire query SELECT semplici direttamente con le API di Supabase
  async executeSelect(query: string, params: any[]) {
    try {
      // Estrai la tabella e le condizioni dalla query
      // Nota: questa è una implementazione semplificata
      const tableMatch = query.match(/from\s+([^\s,]+)/i);
      if (!tableMatch) {
        throw new Error('Impossibile estrarre il nome della tabella dalla query');
      }
      
      const tableName = tableMatch[1];
      let supabaseQuery = supabase.from(tableName).select('*');
      
      // Se ci sono parametri e condizioni WHERE, applicali
      // Questa è una implementazione molto semplificata
      if (params.length > 0 && query.includes('where')) {
        const whereMatch = query.match(/where\s+([^\s]+)\s*=\s*\$1/i);
        if (whereMatch) {
          const column = whereMatch[1];
          supabaseQuery = supabaseQuery.eq(column, params[0]);
        }
      }
      
      const { data, error } = await supabaseQuery;
      
      if (error) {
        console.error('Error executing SELECT via API:', error);
        throw error;
      }
      
      return {
        rows: data || [],
        rowCount: data ? data.length : 0
      };
    } catch (error) {
      console.error('Error in executeSelect:', error);
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