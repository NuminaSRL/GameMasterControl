import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create the database connection using regular PostgreSQL
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// I log ci diranno quale metodo di connessione è in uso
// Temporaneamente forziamo l'uso di PostgreSQL invece di Supabase
const useSupabase = false; // Forzato a false durante la migrazione
console.log(`[Database] Using ${useSupabase ? 'Supabase' : 'PostgreSQL'} for database connection`);