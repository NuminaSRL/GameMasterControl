import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create the database connection using regular PostgreSQL
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Questa connessione è utilizzata solo quando storage.ts usa DatabaseStorage
// Quando viene utilizzato SupabaseStorage, questa connessione non viene utilizzata