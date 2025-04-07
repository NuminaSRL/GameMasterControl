/**
 * Questo file fornisce un livello di astrazione per selezionare il provider
 * di storage (database) utilizzato dall'applicazione.
 * Permette di passare facilmente da Drizzle a Supabase o altri provider di storage.
 */

import { db } from './db';
import { supabase } from './supabase';
import { sql } from 'drizzle-orm';

/**
 * Enumera i possibili provider di storage supportati
 */
export enum StorageProvider {
  DRIZZLE = 'drizzle',
  SUPABASE = 'supabase'
}

/**
 * Classe per configurare il provider di storage
 */
export class StorageProviderManager {
  private static _provider: StorageProvider = StorageProvider.SUPABASE;
  
  /**
   * Imposta il provider di storage da utilizzare
   */
  static setProvider(provider: StorageProvider): void {
    this._provider = provider;
    console.log(`[StorageProviderManager] Provider impostato a: ${provider}`);
  }
  
  /**
   * Restituisce il provider di storage attualmente in uso
   */
  static getProvider(): StorageProvider {
    return this._provider;
  }
  
  /**
   * Verifica se il provider di storage attualmente in uso è Drizzle
   */
  static isDrizzle(): boolean {
    return this._provider === StorageProvider.DRIZZLE;
  }
  
  /**
   * Verifica se il provider di storage attualmente in uso è Supabase
   */
  static isSupabase(): boolean {
    return this._provider === StorageProvider.SUPABASE;
  }
}

/**
 * Funzione per eseguire una query SQL utilizzando il provider selezionato
 * @param tableName Nome della tabella
 * @param queryFn Funzione che esegue la query con Supabase
 * @param drizzleQuery Query SQL da eseguire con Drizzle
 */
export async function executeQuery<T>(
  tableName: string,
  queryFn: () => Promise<{ data: T | null, error: any }>,
  drizzleQuery?: () => Promise<any>
): Promise<{ data: T | null, error: any }> {
  try {
    if (StorageProviderManager.isSupabase()) {
      // Usa Supabase
      return await queryFn();
    } else {
      // Usa Drizzle
      if (!drizzleQuery) {
        throw new Error(`Drizzle query non definita per la tabella ${tableName}`);
      }
      
      const result = await drizzleQuery();
      return { 
        data: result, 
        error: null 
      };
    }
  } catch (error) {
    console.error(`Errore eseguendo query su ${tableName}:`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}

/**
 * Esegue una semplice query SELECT su una tabella
 */
export async function selectFromTable<T>(
  tableName: string,
  options: {
    columns?: string;
    where?: Record<string, any>;
    orderBy?: { column: string, ascending?: boolean };
    limit?: number;
    single?: boolean;
  } = {}
): Promise<{ data: T | null, error: any }> {
  const { columns = '*', where = {}, orderBy, limit, single = false } = options;
  
  // Query Supabase
  const supabaseQuery = async () => {
    let query = supabase
      .from(tableName)
      .select(columns);
    
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
    
    // Ottieni un singolo risultato o una lista
    if (single) {
      return query.single();
    }
    
    return query;
  };
  
  // Query Drizzle (esempio generale, da adattare ai casi specifici)
  const drizzleQuery = async () => {
    // Costruisci una query SQL dinamica basata sui parametri
    let query = `SELECT ${columns} FROM ${tableName}`;
    
    // Costruisci la clausola WHERE
    const whereConditions = Object.entries(where).map(([key, value]) => `${key} = ${JSON.stringify(value)}`);
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Applica ORDER BY
    if (orderBy) {
      query += ` ORDER BY ${orderBy.column} ${orderBy.ascending ? 'ASC' : 'DESC'}`;
    }
    
    // Applica LIMIT
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    // Esegui la query con Drizzle
    const result = await db.execute(sql.raw(query));
    
    // Gestisci il caso di singolo risultato
    if (single && result.rows && result.rows.length > 0) {
      return result.rows[0];
    }
    
    return result.rows || [];
  };
  
  return executeQuery<T>(tableName, supabaseQuery, drizzleQuery);
}

/**
 * Inserisce un nuovo record in una tabella
 */
export async function insertIntoTable<T>(
  tableName: string,
  data: Record<string, any>,
  options: {
    returning?: string;
  } = {}
): Promise<{ data: T | null, error: any }> {
  const { returning = '*' } = options;
  
  // Query Supabase
  const supabaseQuery = async () => {
    return supabase
      .from(tableName)
      .insert(data)
      .select(returning);
  };
  
  // Query Drizzle (esempio generale)
  const drizzleQuery = async () => {
    // Costruisci una query SQL dinamica
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data).map(value => JSON.stringify(value)).join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${columns})
      VALUES (${values})
      RETURNING ${returning}
    `;
    
    const result = await db.execute(sql.raw(query));
    return result.rows && result.rows.length > 0 ? result.rows[0] : null;
  };
  
  return executeQuery<T>(tableName, supabaseQuery, drizzleQuery);
}

/**
 * Aggiorna un record esistente in una tabella
 */
export async function updateTable<T>(
  tableName: string,
  data: Record<string, any>,
  where: Record<string, any>,
  options: {
    returning?: string;
  } = {}
): Promise<{ data: T | null, error: any }> {
  const { returning = '*' } = options;
  
  // Query Supabase
  const supabaseQuery = async () => {
    let query = supabase
      .from(tableName)
      .update(data);
    
    // Applica condizioni WHERE
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    return query.select(returning);
  };
  
  // Query Drizzle (esempio generale)
  const drizzleQuery = async () => {
    // Costruisci i valori SET
    const setValues = Object.entries(data)
      .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
      .join(', ');
    
    // Costruisci la clausola WHERE
    const whereConditions = Object.entries(where)
      .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
      .join(' AND ');
    
    const query = `
      UPDATE ${tableName}
      SET ${setValues}
      WHERE ${whereConditions}
      RETURNING ${returning}
    `;
    
    const result = await db.execute(sql.raw(query));
    return result.rows && result.rows.length > 0 ? result.rows[0] : null;
  };
  
  return executeQuery<T>(tableName, supabaseQuery, drizzleQuery);
}

/**
 * Elimina un record da una tabella
 */
export async function deleteFromTable(
  tableName: string,
  where: Record<string, any>
): Promise<{ error: any }> {
  // Query Supabase
  const supabaseQuery = async () => {
    let query = supabase
      .from(tableName)
      .delete();
    
    // Applica condizioni WHERE
    Object.entries(where).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    return query;
  };
  
  // Query Drizzle (esempio generale)
  const drizzleQuery = async () => {
    // Costruisci la clausola WHERE
    const whereConditions = Object.entries(where)
      .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
      .join(' AND ');
    
    const query = `
      DELETE FROM ${tableName}
      WHERE ${whereConditions}
    `;
    
    await db.execute(sql.raw(query));
    return { error: null };
  };
  
  try {
    if (StorageProviderManager.isSupabase()) {
      // Usa Supabase
      const { error } = await supabaseQuery();
      return { error };
    } else {
      // Usa Drizzle
      return await drizzleQuery();
    }
  } catch (error) {
    console.error(`Errore eliminando da ${tableName}:`, error);
    return { 
      error: error instanceof Error ? error : new Error('Unknown error') 
    };
  }
}

// Imposta il provider di storage predefinito (qui o in un file di configurazione)
StorageProviderManager.setProvider(StorageProvider.SUPABASE);