import { supabase } from './supabase';
import { sql } from 'drizzle-orm'; // Manteniamo questa importazione per compatibilità futura

// Definizione di tipi più precisi per le risposte di Supabase
type SupabaseResponse<T> = {
  data: T | null;
  error: any;
};

/**
 * Esegue una query SQL utilizzando Supabase.
 */
export async function executeQuery<T>(
  tableName: string, 
  queryFn: () => Promise<SupabaseResponse<T>>
): Promise<SupabaseResponse<T>> {
  try {
    return await queryFn();
  } catch (error) {
    console.error(`Errore eseguendo query su ${tableName}:`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Errore sconosciuto') 
    };
  }
}

/**
 * Esegue una semplice query SELECT su una tabella usando Supabase.
 */
export async function selectFromTable<T>(
  tableName: string, 
  options: { 
    columns?: string; 
    where?: Record<string, any>; 
    orderBy?: { column: string; ascending?: boolean; }; 
    limit?: number; 
    single?: boolean; 
  } = {}
): Promise<SupabaseResponse<T>> {
  const { columns = '*', where = {}, orderBy, limit, single = false } = options;

  const supabaseQuery = async () => {
    try {
      let query = supabase.from(tableName).select(columns);

      // Applica condizioni WHERE
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Applica ORDER BY
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Applica LIMIT
      if (limit) {
        query = query.limit(limit);
      }

      // Utilizziamo un approccio più diretto senza Promise.resolve
      if (single) {
        try {
          // Utilizziamo una tipizzazione più esplicita e un approccio diverso
          type SupabaseQueryResult = { data: any; error: any };
          
          // Eseguiamo la query in modo più diretto
          let queryPromise: Promise<SupabaseQueryResult>;
          
          queryPromise = Promise.resolve(query.single()) as Promise<SupabaseQueryResult>;
              
          const result = await queryPromise;
          return { 
            data: result.data as T, 
            error: result.error 
          };
        } catch (singleError) {
          console.error(`Errore nella query single() su ${tableName}:`, singleError);
          return { 
            data: null, 
            error: singleError 
          };
        }
      } else {
        try {
          // Utilizziamo una tipizzazione più esplicita e un approccio diverso
          type SupabaseQueryResult = { data: any; error: any };
          
          // Eseguiamo la query in modo più diretto
          let queryPromise: Promise<SupabaseQueryResult>;
          
          queryPromise = Promise.resolve(query) as Promise<SupabaseQueryResult>;
              
          const result = await queryPromise;
          return { 
            data: result.data as T, 
            error: result.error 
          };
        } catch (queryError) {
          console.error(`Errore nella query su ${tableName}:`, queryError);
          return { 
            data: null, 
            error: queryError 
          };
        }
      }
    } catch (error) {
      console.error(`Errore generale nella query Supabase su ${tableName}:`, error);
      return { 
        data: null, 
        error 
      };
    }
  };

  return executeQuery<T>(tableName, supabaseQuery);
}

/**
 * Inserisce un nuovo record in una tabella usando Supabase.
 */
export async function insertIntoTable<T>(
  tableName: string, 
  data: Record<string, any>, 
  options: { returning?: string; } = {}
): Promise<SupabaseResponse<T>> {
  const { returning = '*' } = options;

  const supabaseQuery = async () => {
    try {
      // Utilizziamo una tipizzazione più esplicita e un approccio diverso
      type SupabaseQueryResult = { data: any; error: any };
      
      // Eseguiamo la query in modo più diretto
      let queryPromise: Promise<SupabaseQueryResult>;
      
      try {
        queryPromise = Promise.resolve(supabase
          .from(tableName)
          .insert(data)
          .select(returning)) as Promise<SupabaseQueryResult>;
          
        const result = await queryPromise;
        return { 
          data: result.data as T, 
          error: result.error 
        };
      } catch (queryError) {
        console.error(`Errore specifico nell'inserimento su ${tableName}:`, queryError);
        return { 
          data: null, 
          error: queryError 
        };
      }
    } catch (error) {
      console.error(`Errore nell'inserimento Supabase su ${tableName}:`, error);
      return { 
        data: null, 
        error 
      };
    }
  };

  return executeQuery<T>(tableName, supabaseQuery);
}

/**
 * Aggiorna un record esistente in una tabella usando Supabase.
 */
export async function updateTable<T>(
  tableName: string, 
  data: Record<string, any>, 
  where: Record<string, any>, 
  options: { returning?: string; } = {}
): Promise<SupabaseResponse<T>> {
  const { returning = '*' } = options;

  const supabaseQuery = async () => {
    try {
      let query = supabase.from(tableName).update(data);
      
      // Applica condizioni WHERE
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      // Utilizziamo una tipizzazione più esplicita e un approccio diverso
      type SupabaseQueryResult = { data: any; error: any };
      
      // Eseguiamo la query in modo più diretto
      let queryPromise: Promise<SupabaseQueryResult>;
      
      try {
        queryPromise = Promise.resolve(query.select(returning)) as Promise<SupabaseQueryResult>;
          
        const result = await queryPromise;
        return { 
          data: result.data as T, 
          error: result.error 
        };
      } catch (queryError) {
        console.error(`Errore specifico nell'aggiornamento su ${tableName}:`, queryError);
        return { 
          data: null, 
          error: queryError 
        };
      }
      
   
    } catch (error) {
      console.error(`Errore nell'aggiornamento Supabase su ${tableName}:`, error);
      return { 
        data: null, 
        error 
      };
    }
  };

  return executeQuery<T>(tableName, supabaseQuery);
}

/**
 * Elimina un record da una tabella usando Supabase.
 */
export async function deleteFromTable(
  tableName: string, 
  where: Record<string, any>
): Promise<{ error: any }> {
  const supabaseQuery = async () => {
    try {
      let query = supabase.from(tableName).delete();
      
      // Applica condizioni WHERE
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      // Utilizziamo una tipizzazione più esplicita e un approccio diverso
      type SupabaseQueryResult = { data: any; error: any };
      
      // Eseguiamo la query in modo più diretto
      let queryPromise: Promise<SupabaseQueryResult>;
      
      try {
        queryPromise = Promise.resolve(query) as Promise<SupabaseQueryResult>;
          
        const result = await queryPromise;
        return { 
          data: null,  // Aggiungiamo data: null per conformarci al tipo SupabaseResponse
          error: result.error 
        };
      } catch (queryError) {
        console.error(`Errore specifico nell'eliminazione su ${tableName}:`, queryError);
        return { 
          data: null,  // Aggiungiamo data: null per conformarci al tipo SupabaseResponse
          error: queryError 
        };
      }

    } catch (error) {
      console.error(`Errore nell'eliminazione Supabase su ${tableName}:`, error);
      return { 
        data: null,  // Aggiungiamo data: null per conformarci al tipo SupabaseResponse
        error 
      };
    }
  };

  // Ora possiamo usare il tipo corretto
  return executeQuery<null>(tableName, supabaseQuery);
}