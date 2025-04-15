import {
  type User, type InsertUser,
  type Game, type InsertGame,
  type Badge, type InsertBadge,
  type Reward, type InsertReward,
  type GameBadge, type InsertGameBadge,
  type Stats
} from "@shared/schema";
import { IStorage } from "./storage";
import { supabase, formatDates } from "./supabase";

// Funzione di init per creare le tabelle in Supabase se non esistono
export async function initSupabaseTables() {
  try {
    console.log("[Supabase] Initializing tables...");
    
    // Verifichiamo prima se le tabelle esistono utilizzando select dirette
    const existingTables = await checkExistingTables();
    
    // Se non tutte le tabelle sono presenti, proviamo a crearle manualmente
    if (!existingTables.every(exists => exists)) {
      await createTablesManually();
      
      // Verifichiamo ancora una volta
      const tablesNow = await checkExistingTables();
      if (!tablesNow.every(exists => exists)) {
        console.error("[Supabase] Failed to create all required tables");
      } else {
        console.log("[Supabase] All required tables are now present");
      }
    } else {
      console.log("[Supabase] All required tables already exist");
    }
  } catch (err) {
    console.error("[Supabase] Error in table initialization:", err);
  }
}

// Verifica se le tabelle esistono già
async function checkExistingTables() {
  // Aggiungiamo 'clients' alla lista delle tabelle richieste
  const requiredTables = ['users', 'games', 'badges', 'flt_game_badges', 'rewards', 'stats', 'clients'];
  const results = [];
  
  for (const table of requiredTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error && error.code === 'PGRST104') {
        // Tabella non esiste (error code for "relation does not exist")
        console.log(`[Supabase] Table "${table}" does not exist`);
        results.push(false);
      } else {
        console.log(`[Supabase] Table "${table}" exists, count: ${count}`);
        results.push(true);
      }
    } catch (err) {
      console.error(`[Supabase] Error checking table "${table}":`, err);
      results.push(false);
    }
  }
  
  return results;
}

// Crea le tabelle manualmente utilizzando l'interfaccia SQL di Supabase
async function createTablesManually() {
  console.log("[Supabase] Creating tables manually using Supabase API");
  
  try {
    // Crea la tabella users se non esiste
    const createUsers = await supabase.rpc('create_users_table_if_not_exists');
    console.log("[Supabase] Users table created or verified");
    
    // Crea la tabella games se non esiste
    const createGames = await supabase.rpc('create_games_table_if_not_exists');
    console.log("[Supabase] Games table created or verified");
    
    // Crea la tabella badges se non esiste
    const createBadges = await supabase.rpc('create_badges_table_if_not_exists');
    console.log("[Supabase] Badges table created or verified");
    
    // Crea la tabella flt_game_badges se non esiste
    const createGameBadges = await supabase.rpc('create_flt_game_badges_table_if_not_exists');
    console.log("[Supabase] flt_game_badges table created or verified");
    
    // Crea la tabella rewards se non esiste
    const createRewards = await supabase.rpc('create_rewards_table_if_not_exists');
    console.log("[Supabase] Rewards table created or verified");
    
    // Crea la tabella stats se non esiste
    const createStats = await supabase.rpc('create_stats_table_if_not_exists');
    console.log("[Supabase] Stats table created or verified");
    
    // Verifica se esistono gli RPC
    if (createUsers.error || createGames.error || createBadges.error || 
        createGameBadges.error || createRewards.error || createStats.error) {
      console.error("[Supabase] Some RPC function not found. Please create stored procedures in Supabase");
      // Come soluzione temporanea, torniamo alla modalità PostgreSQL
      console.log("[Supabase] Temporarily switching back to PostgreSQL storage");
    } else {
      console.log("[Supabase] All tables created successfully");
    }
  } catch (error) {
    console.error("[Supabase] Error during table creation:", error);
    console.error("[Supabase] Automatic table creation failed.");
    console.error("[Supabase] Please run the migration-script.sql manually in the Supabase dashboard's SQL Editor.");
    
    // Come soluzione temporanea, torniamo alla modalità PostgreSQL
    console.log("[Supabase] Temporarily switching back to PostgreSQL storage");
  }
}

/**
 * Implementazione di IStorage che utilizza Supabase
 */
export class SupabaseStorage implements IStorage {
  // === User operations ===

  async getUserByEmail(email: string): Promise<any> {
    console.log(`[SupabaseStorage] Getting user by email ${email}`);
    try {
      // Verifichiamo prima nella tabella auth.users di Supabase
      // Utilizziamo il metodo corretto dell'API di Supabase
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error(`[SupabaseStorage] Error listing users: ${error}`);
      } else if (data && data.users) {
        // Cerchiamo manualmente l'utente con l'email specificata
        const authUser = data.users.find(user => user.email === email);
        
        if (authUser) {
          console.log(`[SupabaseStorage] Found user in Supabase Auth: ${authUser.id}`);
          
          // Recuperiamo i dati del profilo dalla tabella profiles
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();
          
          if (profileError) {
            console.error(`[SupabaseStorage] Error getting profile: ${profileError}`);
          } else if (profileData) {
            console.log(`[SupabaseStorage] Found profile for user: ${authUser.id} with client_id: ${profileData.client_id}`);
            
            // Restituiamo un oggetto che combina i dati di autenticazione e profilo
            return {
              id: authUser.id,
              email: authUser.email,
              username: profileData.username, // Include username for login
              role: profileData.role || 'user',
              client_id: profileData.client_id,
              is_active: profileData.is_active,
              // Non includiamo la password perché gestita da Supabase Auth
              is_auth_user: true, // Flag per indicare che è un utente autenticato tramite Supabase
              auth_id: authUser.id // Include the auth ID for verification
            };
          } else {
            console.log(`[SupabaseStorage] No profile found for auth user: ${authUser.id}`);
          }
        }
      }
      
      // Se non troviamo l'utente in auth, verifichiamo nella tabella flt_profiles
      // per retrocompatibilità
      const { data: fltData, error: fltError } = await supabase
        .from('flt_profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (fltError) {
        console.error(`[SupabaseStorage] Error getting user by email from flt_profiles: ${fltError}`);
        return null;
      }
      
      return fltData;
    } catch (error) {
      console.error(`[SupabaseStorage] Error getting user by email:`, error);
      return null;
    }
  }

    // Aggiungi questo metodo alla classe SupabaseStorage
    async verifyPassword(email: string, password: string): Promise<boolean> {
      console.log(`[SupabaseStorage] Verifica password per l'utente: ${email}`);
      try {
        // Usa l'API di Supabase per verificare la password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.error(`[SupabaseStorage] Errore verifica password:`, error);
          return false;
        }
        
        console.log(`[SupabaseStorage] Password verificata con successo per l'utente: ${email}`);
        return !!data.user;
      } catch (error) {
        console.error(`[SupabaseStorage] Errore durante la verifica della password:`, error);
        return false;
      }
    }
    
    async supabaseSignIn(email: string, password: string): Promise<any> {
      console.log(`[SupabaseStorage] Tentativo di login Supabase per l'utente: ${email}`);
      return await supabase.auth.signInWithPassword({
        email,
        password
      });
    }
  
  async getRewardsByClient(clientId: number): Promise<any[]> {
    console.log(`[SupabaseStorage] Getting rewards by client ${clientId}`);
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('client_id', clientId)
        .order('name');
        
      if (error) {
        console.error('[SupabaseStorage] Error getting rewards by client:', error);
        return [];
      }
      
      console.log('[SupabaseStorage] Rewards found by client:', data ? data.length : 0);
      return data || [];
    } catch (error) {
      console.error('[SupabaseStorage] Error getting rewards by client:', error);
      return [];
    }
  }

  async getUserById(id: string): Promise<any> {
    console.log(`[SupabaseStorage] Getting user by ID ${id}`);
    try {
      // Cerca prima nella tabella profiles standard
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (profileData) {
        console.log(`[SupabaseStorage] Found user in profiles with client_id: ${profileData.client_id}`);
        
        // Recuperiamo i dati di autenticazione
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(id);
        
        if (authError) {
          console.error(`[SupabaseStorage] Error getting auth data: ${authError}`);
        } else if (authData && authData.user) {
          // Combiniamo i dati di auth e profile
          return {
            id: authData.user.id,
            email: authData.user.email,
            role: profileData.role || 'user',
            client_id: profileData.client_id,
            is_active: profileData.is_active,
            is_auth_user: true
          };
        }
        
        // Se non troviamo i dati auth, restituiamo solo il profilo
        return profileData;
      }
      
      // Se non troviamo nella tabella profiles, cerchiamo nella tabella flt_profiles
      const { data: fltProfileData, error: fltProfileError } = await supabase
        .from('flt_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (fltProfileData) {
        console.log(`[SupabaseStorage] Found user in flt_profiles with client_id: ${fltProfileData.client_id}`);
        return fltProfileData;
      }
      
      if (profileError) {
        console.error(`[SupabaseStorage] Error getting user by ID from profiles: ${profileError}`);
      }
      
      if (fltProfileError) {
        console.error(`[SupabaseStorage] Error getting user by ID from flt_profiles: ${fltProfileError}`);
      }
      
      return null;
    } catch (error) {
      console.error(`[SupabaseStorage] Error getting user by ID:`, error);
      return null;
    }
  }


// Nella classe SupabaseStorage, assicurati che ci sia questo metodo
async getAllClients(): Promise<any[]> {
  console.log('[SupabaseStorage] Getting all clients - START');
  try {
    console.log('[SupabaseStorage] About to query Supabase clients table');
    console.log('[SupabaseStorage] Supabase URL:', process.env.SUPABASE_URL);
    
    // Verifica se la tabella clients esiste
    const { count, error: countError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('[SupabaseStorage] Error checking clients table:', countError);
      // Se la tabella non esiste, potremmo crearla
      if (countError.code === 'PGRST104') {
        console.log('[SupabaseStorage] Clients table does not exist, attempting to create it');
        await this._createClientsTable();
        return []; // Ritorniamo un array vuoto per questa chiamata
      }
      throw countError;
    }
    
    console.log(`[SupabaseStorage] Clients table exists with ${count} records`);
    
    // Procedi con la query originale
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, logo_url, created_at, updated_at')
      .order('name');
      
    if (error) {
      console.error('[SupabaseStorage] Error getting clients:', error);
      throw error;
    }
    
    console.log('[SupabaseStorage] Clients found:', data ? JSON.stringify(data) : 'null');
    return data || [];
  } catch (error) {
    console.error('[SupabaseStorage] Error getting all clients:', error);
    return [];
  } finally {
    console.log('[SupabaseStorage] Getting all clients - END');
  }
}

// Metodo privato per creare la tabella clients se non esiste
async _createClientsTable(): Promise<void> {
  try {
    console.log('[SupabaseStorage] Creating clients table');
    
    // Esegui SQL per creare la tabella
    const { error } = await supabase.rpc('create_clients_table_if_not_exists');
    
    if (error) {
      console.error('[SupabaseStorage] Error creating clients table via RPC:', error);
      
      // Fallback: crea la tabella direttamente con SQL
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS clients (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            logo_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (sqlError) {
        console.error('[SupabaseStorage] Error creating clients table via SQL:', sqlError);
        throw sqlError;
      }
    }
    
    console.log('[SupabaseStorage] Clients table created successfully');
  } catch (error) {
    console.error('[SupabaseStorage] Failed to create clients table:', error);
    throw error;
  }
}

// Aggiungiamo il metodo getClient
async getClient(id: number): Promise<any> {
  console.log(`[SupabaseStorage] Getting client with id ${id}`);
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('[SupabaseStorage] Error getting client:', error);
      return null;
    }
    
    console.log('[SupabaseStorage] Client found:', data);
    return data;
  } catch (error) {
    console.error('[SupabaseStorage] Error getting client:', error);
    return null;
  }
}

// Aggiungiamo il metodo getClientById
async getClientById(id: number): Promise<any> {
  console.log(`[SupabaseStorage] Getting client by id ${id}`);
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, logo_url, created_at, updated_at')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('[SupabaseStorage] Error getting client by id:', error);
      return null;
    }
    
    console.log('[SupabaseStorage] Client found by id:', data);
    return data;
  } catch (error) {
    console.error('[SupabaseStorage] Error getting client by id:', error);
    return null;
  }
}
  
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return formatDates(data) as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return formatDates(data) as User;
  }

  async createUser(userData: any): Promise<any> {
    console.log(`[SupabaseStorage] Creating user with email ${userData.email}`);
    try {
      // Verifichiamo che sia stato fornito un client_id
      if (!userData.clientId) {
        console.error(`[SupabaseStorage] Client ID is required for user creation`);
        throw new Error('Client ID is required for user creation');
      }
      
      console.log(`[SupabaseStorage] Creating user for client ID: ${userData.clientId}`);
      
      // Creiamo l'utente in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true // Conferma automaticamente l'email
      });
      
      if (authError) {
        console.error(`[SupabaseStorage] Error creating auth user: ${authError}`);
        throw authError;
      }
      
      console.log(`[SupabaseStorage] Created auth user: ${authUser.user.id}`);
      
      // Creiamo il profilo associato all'utente con client_id
      // Generiamo un username basato sull'email (parte prima della @)
      const username = userData.email.split('@')[0];
      
      const profileData = {
        id: authUser.user.id,
        username: username, // Aggiungiamo l'username richiesto
        role: userData.role || 'user',
        client_id: userData.clientId,
        is_active: true
      };
      
      console.log(`[SupabaseStorage] Creating profile with data:`, profileData);
      
      const { data: createdProfile, error: profileError } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      
      if (profileError) {
        console.error(`[SupabaseStorage] Error creating profile: ${profileError}`);
        // Se fallisce la creazione del profilo, eliminiamo l'utente auth
        await supabase.auth.admin.deleteUser(authUser.user.id);
        throw profileError;
      }
      
      console.log(`[SupabaseStorage] Created profile for user: ${authUser.user.id} with client_id: ${createdProfile.client_id}`);
      
      // Restituiamo un oggetto che combina i dati di autenticazione e profilo
      return {
        id: authUser.user.id,
        email: authUser.user.email,
        username: createdProfile.username,
        role: createdProfile.role,
        client_id: createdProfile.client_id,
        is_active: createdProfile.is_active
      };
    } catch (error) {
      console.error(`[SupabaseStorage] Error creating user:`, error);
      throw error;
    }
  }

  // === Game operations ===
  
  async getAllGames(): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('id');
    
    if (error) throw new Error(`Failed to fetch games: ${error.message}`);
    return (data || []).map(game => formatDates(this._mapDbGameToSchema(game)));
  }

  async getGame(id: number): Promise<Game | undefined> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return formatDates(this._mapDbGameToSchema(data));
  }

  async createGame(game: InsertGame): Promise<Game> {
    // Convert to DB format
    const dbGame = this._mapSchemaGameToDb(game);
    
    const { data, error } = await supabase
      .from('games')
      .insert([dbGame])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create game: ${error.message}`);
    
    // Update stats
    const { data: statsData } = await supabase
      .from('stats')
      .select('*')
      .limit(1)
      .single();
    
    if (statsData) {
      await supabase
        .from('stats')
        .update({
          total_games: statsData.total_games + 1,
          active_games: dbGame.is_active ? statsData.active_games + 1 : statsData.active_games,
          updated_at: new Date()
        })
        .eq('id', statsData.id);
    } else {
      // Initialize stats if they don't exist
      await supabase
        .from('stats')
        .insert([{
          total_games: 1,
          active_games: dbGame.is_active ? 1 : 0,
          active_users: 0,
          awarded_badges: 0
        }]);
    }
    
    return formatDates(this._mapDbGameToSchema(data));
  }

  async updateGame(id: number, gameUpdate: Partial<InsertGame>): Promise<Game | undefined> {
    // Get existing game
    const { data: existingGame } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!existingGame) return undefined;
    
    // Track if active status has changed for stats update
    const wasActive = existingGame.is_active;
    const willBeActive = gameUpdate.isActive !== undefined ? gameUpdate.isActive : wasActive;
    
    // Convert to DB format
    const dbGameUpdate = this._mapSchemaGameToDb(gameUpdate as InsertGame, true);
    
    const { data, error } = await supabase
      .from('games')
      .update(dbGameUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update game: ${error.message}`);
    
    // Update stats if active status changed
    if (wasActive !== willBeActive) {
      const { data: statsData } = await supabase
        .from('stats')
        .select('*')
        .limit(1)
        .single();
      
      if (statsData) {
        await supabase
          .from('stats')
          .update({
            active_games: willBeActive ? statsData.active_games + 1 : statsData.active_games - 1,
            updated_at: new Date()
          })
          .eq('id', statsData.id);
      }
    }
    
    return formatDates(this._mapDbGameToSchema(data));
  }

  async toggleGameStatus(id: number): Promise<Game | undefined> {
    // Get existing game
    const { data: existingGame } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!existingGame) return undefined;
    
    // Toggle status
    const newStatus = !existingGame.is_active;
    
    const { data, error } = await supabase
      .from('games')
      .update({ is_active: newStatus })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to toggle game status: ${error.message}`);
    
    // Update stats
    const { data: statsData } = await supabase
      .from('stats')
      .select('*')
      .limit(1)
      .single();
    
    if (statsData) {
      await supabase
        .from('stats')
        .update({
          active_games: newStatus ? statsData.active_games + 1 : statsData.active_games - 1,
          updated_at: new Date()
        })
        .eq('id', statsData.id);
    }
    
    return formatDates(this._mapDbGameToSchema(data));
  }

  // === Badge operations ===
  
  async getAllBadges(): Promise<Badge[]> {
    // Prima tentiamo di recuperare i badge dalla tabella 'flt_game_badges'
    try {
      console.log("Tentativo di recuperare tutti i badges da Supabase...");
      const { data, error } = await supabase
        .from('flt_game_badges')
        .select('*')
        .order('id');
      
      if (error) {
        console.log(`Errore nel recuperare badge da 'flt_game_badges': ${error.message}`);
        throw error;
      }
      
      console.log(`Recuperati ${data?.length || 0} badges dalla tabella 'flt_game_badges'`);
      return (data || []).map(badge => formatDates(this._mapDbBadgeToSchema(badge)));
    } catch (error) {
      // Se fallisce, proviamo con la tabella 'badges' come fallback
      console.log("Fallback: tentativo di recuperare badges dalla tabella 'badges'...");
      const { data, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('id');
      
      if (badgesError) {
        console.error(`Fallimento completo nel recuperare badge: ${badgesError.message}`);
        throw new Error(`Failed to fetch badges: ${badgesError.message}`);
      }
      
      console.log(`Recuperati ${data?.length || 0} badges dalla tabella 'badges'`);
      return (data || []).map(badge => formatDates(this._mapDbBadgeToSchema(badge)));
    }
  }

  async getBadge(id: number): Promise<Badge | undefined> {
    // Prima tentiamo con la tabella 'flt_game_badges'
    try {
      const { data, error } = await supabase
        .from('flt_game_badges')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        console.log(`Badge con ID ${id} recuperato da 'flt_game_badges'`);
        return formatDates(this._mapDbBadgeToSchema(data));
      }
    } catch (error) {
      console.log(`Errore nel recuperare badge ID ${id} da 'flt_game_badges': ${error}`);
    }
    
    // Se non trovato, tentiamo con la tabella 'badges'
    console.log(`Fallback: tentativo di recuperare badge ID ${id} dalla tabella 'badges'...`);
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.log(`Badge ID ${id} non trovato in nessuna tabella`);
      return undefined;
    }
    
    console.log(`Badge con ID ${id} recuperato da 'badges'`);
    return formatDates(this._mapDbBadgeToSchema(data));
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    // Convert to DB format
    const dbBadge = this._mapSchemaBadgeToDb(badge);
    
    // Tentiamo di inserire nella tabella 'flt_game_badges'
    try {
      console.log("Tentativo di inserire badge in 'flt_game_badges'...");
      const { data, error } = await supabase
        .from('flt_game_badges')
        .insert([dbBadge])
        .select()
        .single();
      
      if (error) {
        console.log(`Errore nell'inserire badge in 'flt_game_badges': ${error.message}`);
        throw error;
      }
      
      console.log("Badge inserito con successo in 'flt_game_badges'");
      return formatDates(this._mapDbBadgeToSchema(data));
    } catch (error) {
      // Se fallisce, tentiamo di inserire nella tabella 'badges'
      console.log("Fallback: tentativo di inserire badge nella tabella 'badges'...");
      const { data, error: badgesError } = await supabase
        .from('badges')
        .insert([dbBadge])
        .select()
        .single();
      
      if (badgesError) {
        console.error(`Fallimento completo nell'inserire badge: ${badgesError.message}`);
        throw new Error(`Failed to create badge: ${badgesError.message}`);
      }
      
      console.log("Badge inserito con successo in 'badges'");
      return formatDates(this._mapDbBadgeToSchema(data));
    }
  }

  // === Reward operations ===
  
  async getAllRewards(): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .order('id');
    
    if (error) throw new Error(`Failed to fetch rewards: ${error.message}`);
    return (data || []).map(reward => formatDates(this._mapDbRewardToSchema(reward)));
  }

  async getReward(id: number): Promise<Reward | undefined> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return formatDates(this._mapDbRewardToSchema(data));
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    // Convert to DB format
    const dbReward = this._mapSchemaRewardToDb(reward);
    
    const { data, error } = await supabase
      .from('rewards')
      .insert([dbReward])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create reward: ${error.message}`);
    return formatDates(this._mapDbRewardToSchema(data));
  }
  
  async updateReward(id: number, rewardUpdate: Partial<InsertReward>): Promise<Reward | undefined> {
    // Check if reward exists
    const { data: existingReward, error: checkError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .single();
    
    if (checkError || !existingReward) return undefined;
    
    // Convert from schema to db format
    const dbReward = this._mapSchemaRewardToDb(rewardUpdate as InsertReward);
    
    // Update reward
    const { data, error } = await supabase
      .from('rewards')
      .update(dbReward)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update reward: ${error.message}`);
    return formatDates(this._mapDbRewardToSchema(data));
  }
  
  async deleteReward(id: number): Promise<void> {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`Failed to delete reward: ${error.message}`);
  }

  // === Game-Badge operations ===
  
  async getGameBadges(gameId: number): Promise<Badge[]> {
    const { data: gameBadgeRelations, error } = await supabase
      .from('flt_game_badges')
      .select('badge_id')
      .eq('game_id', gameId);
    
    if (error) throw new Error(`Failed to fetch game badges: ${error.message}`);
    
    if (gameBadgeRelations.length === 0) {
      return [];
    }
    
    const badgeIds = gameBadgeRelations.map(rel => rel.badge_id);
    
    // Prima proviamo a recuperare le badge dalla tabella 'flt_game_badges'
    try {
      console.log(`Tentativo di recuperare ${badgeIds.length} badges da 'flt_game_badges'...`);
      const { data: badgeList, error } = await supabase
        .from('flt_game_badges')
        .select('*')
        .in('id', badgeIds);
      
      if (error) {
        console.log(`Errore nel recuperare badges da 'flt_game_badges': ${error.message}`);
        throw error;
      }
      
      console.log(`Recuperati ${badgeList?.length || 0} badges dalla tabella 'flt_game_badges'`);
      return (badgeList || []).map(badge => formatDates(this._mapDbBadgeToSchema(badge)));
    } catch (error) {
      // Se fallisce, tentiamo con la tabella 'badges'
      console.log(`Fallback: tentativo di recuperare badges dalla tabella 'badges'...`);
      const { data: badgeList, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .in('id', badgeIds);
      
      if (badgesError) {
        console.error(`Fallimento completo nel recuperare badges: ${badgesError.message}`);
        throw new Error(`Failed to fetch badges: ${badgesError.message}`);
      }
      
      console.log(`Recuperati ${badgeList?.length || 0} badges dalla tabella 'badges'`);
      return (badgeList || []).map(badge => formatDates(this._mapDbBadgeToSchema(badge)));
    }
  }

  async assignBadgeToGame(gameBadge: InsertGameBadge): Promise<GameBadge> {
    // Check if already exists
    const { data: existing, error: checkError } = await supabase
      .from('flt_game_badges')
      .select('*')
      .eq('game_id', gameBadge.gameId)
      .eq('badge_id', gameBadge.badgeId)
      .single();
    
    if (existing) {
      throw new Error("Badge already assigned to this game");
    }
    
    // Convert to DB format
    const dbGameBadge = {
      game_id: gameBadge.gameId,
      badge_id: gameBadge.badgeId
    };
    
    const { data, error } = await supabase
      .from('flt_game_badges')
      .insert([dbGameBadge])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to assign badge to game: ${error.message}`);
    
    return {
      id: data.id,
      gameId: data.game_id,
      badgeId: data.badge_id
    };
  }

  async removeBadgeFromGame(gameId: number, badgeId: number): Promise<void> {
    const { error } = await supabase
      .from('flt_game_badges')
      .delete()
      .eq('game_id', gameId)
      .eq('badge_id', badgeId);
    
    if (error) throw new Error(`Failed to remove badge from game: ${error.message}`);
  }

  // === Stats operations ===
  
  async getStats(): Promise<Stats> {
    const { data, error } = await supabase
      .from('stats')
      .select('*')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 è un errore "nessun risultato", che vogliamo gestire senza lanciare un'eccezione
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }
    
    if (!data) {
      // Initialize stats if they don't exist
      const { data: newStats, error: insertError } = await supabase
        .from('stats')
        .insert([{
          total_games: 0,
          active_games: 0,
          active_users: 0,
          awarded_badges: 0
        }])
        .select()
        .single();
      
      if (insertError) throw new Error(`Failed to initialize stats: ${insertError.message}`);
      
      return formatDates(this._mapDbStatsToSchema(newStats));
    }
    
    return formatDates(this._mapDbStatsToSchema(data));
  }

  async updateStats(statsUpdate: Partial<Stats>): Promise<Stats> {
    const { data: existingStats, error: fetchError } = await supabase
      .from('stats')
      .select('*')
      .limit(1)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch stats for update: ${fetchError.message}`);
    }
    
    if (!existingStats) {
      // Initialize stats if they don't exist with the provided updates
      const dbStats = {
        total_games: statsUpdate.totalGames || 0,
        active_games: statsUpdate.activeGames || 0,
        active_users: statsUpdate.activeUsers || 0,
        awarded_badges: statsUpdate.awardedBadges || 0,
      };
      
      const { data: newStats, error: insertError } = await supabase
        .from('stats')
        .insert([dbStats])
        .select()
        .single();
      
      if (insertError) throw new Error(`Failed to initialize stats: ${insertError.message}`);
      
      return formatDates(this._mapDbStatsToSchema(newStats));
    }
    
    // Update existing stats
    const dbStatsUpdate = {
      ...(statsUpdate.totalGames !== undefined && { total_games: statsUpdate.totalGames }),
      ...(statsUpdate.activeGames !== undefined && { active_games: statsUpdate.activeGames }),
      ...(statsUpdate.activeUsers !== undefined && { active_users: statsUpdate.activeUsers }),
      ...(statsUpdate.awardedBadges !== undefined && { awarded_badges: statsUpdate.awardedBadges }),
      updated_at: new Date()
    };
    
    const { data: updatedStats, error: updateError } = await supabase
      .from('stats')
      .update(dbStatsUpdate)
      .eq('id', existingStats.id)
      .select()
      .single();
    
    if (updateError) throw new Error(`Failed to update stats: ${updateError.message}`);
    
    return formatDates(this._mapDbStatsToSchema(updatedStats));
  }

  // === Helper methods for mapping between schema and DB formats ===
  
  private _mapDbGameToSchema(dbGame: any): Game {
    return {
      id: dbGame.id,
      name: dbGame.name,
      description: dbGame.description,
      isActive: dbGame.is_active,
      timerDuration: dbGame.timer_duration,
      questionCount: dbGame.question_count,
      weeklyLeaderboard: dbGame.weekly_leaderboard,
      monthlyLeaderboard: dbGame.monthly_leaderboard,
      reward: dbGame.reward,
      gameType: dbGame.game_type,
      feltrinelliGameId: dbGame.feltrinelli_game_id,
      difficulty: dbGame.difficulty,
      createdAt: dbGame.created_at
    };
  }

  private _mapSchemaGameToDb(schemaGame: Partial<InsertGame>, isUpdate = false): any {
    const dbGame: any = {};
    
    if (schemaGame.name !== undefined) dbGame.name = schemaGame.name;
    if (schemaGame.description !== undefined) dbGame.description = schemaGame.description;
    if (schemaGame.isActive !== undefined) dbGame.is_active = schemaGame.isActive;
    if (schemaGame.timerDuration !== undefined) dbGame.timer_duration = schemaGame.timerDuration;
    if (schemaGame.questionCount !== undefined) dbGame.question_count = schemaGame.questionCount;
    if (schemaGame.weeklyLeaderboard !== undefined) dbGame.weekly_leaderboard = schemaGame.weeklyLeaderboard;
    if (schemaGame.monthlyLeaderboard !== undefined) dbGame.monthly_leaderboard = schemaGame.monthlyLeaderboard;
    if (schemaGame.reward !== undefined) dbGame.reward = schemaGame.reward;
    if (schemaGame.gameType !== undefined) dbGame.game_type = schemaGame.gameType;
    if (schemaGame.feltrinelliGameId !== undefined) dbGame.feltrinelli_game_id = schemaGame.feltrinelliGameId;
    if (schemaGame.difficulty !== undefined) dbGame.difficulty = schemaGame.difficulty;
    
    // Per gli inserimenti, aggiungiamo la data di creazione
    if (!isUpdate) {
      dbGame.created_at = new Date();
    }
    
    return dbGame;
  }

  private _mapDbBadgeToSchema(dbBadge: any): Badge {
    return {
      id: dbBadge.id,
      name: dbBadge.name,
      description: dbBadge.description,
      icon: dbBadge.icon,
      color: dbBadge.color,
      createdAt: dbBadge.created_at
    };
  }

  private _mapSchemaBadgeToDb(schemaBadge: InsertBadge): any {
    return {
      name: schemaBadge.name,
      description: schemaBadge.description,
      icon: schemaBadge.icon,
      color: schemaBadge.color,
      created_at: new Date()
    };
  }

  private _mapDbRewardToSchema(dbReward: any): Reward {
    return {
      id: dbReward.id,
      name: dbReward.name,
      description: dbReward.description,
      type: dbReward.type,
      value: dbReward.value,
      icon: dbReward.icon,
      color: dbReward.color,
      available: dbReward.available,
      rank: dbReward.rank || 10,
      imageUrl: dbReward.image_url || null,
      gameType: dbReward.game_type || 'books',
      feltrinelliRewardId: dbReward.feltrinelli_reward_id || null,
      isImported: dbReward.is_imported || false,
      pointsRequired: dbReward.points_required || 0,
      originalImageUrl: dbReward.original_image_url || null,
      syncedAt: dbReward.synced_at || null,
      createdAt: dbReward.created_at
    };
  }

  private _mapSchemaRewardToDb(schemaReward: InsertReward): any {
    return {
      name: schemaReward.name,
      description: schemaReward.description,
      type: schemaReward.type,
      value: schemaReward.value,
      icon: schemaReward.icon,
      color: schemaReward.color,
      available: schemaReward.available,
      rank: schemaReward.rank || 10,
      image_url: schemaReward.imageUrl || null,
      game_type: schemaReward.gameType || 'books',
      feltrinelli_reward_id: schemaReward.feltrinelliRewardId || null,
      is_imported: schemaReward.isImported || false,
      points_required: schemaReward.pointsRequired || 0,
      original_image_url: schemaReward.originalImageUrl || null,
      synced_at: schemaReward.syncedAt || null,
      created_at: new Date()
    };
  }

  private _mapDbStatsToSchema(dbStats: any): Stats {
    return {
      id: dbStats.id,
      totalGames: dbStats.total_games,
      activeGames: dbStats.active_games,
      activeUsers: dbStats.active_users,
      awardedBadges: dbStats.awarded_badges,
      updatedAt: dbStats.updated_at
    };
  }
}
