import {
  // Remove unused constants but keep the type imports
  type User, type InsertUser,
  type Game, type InsertGame,
  type Badge, type InsertBadge,
  type Reward, type InsertReward,
  type GameBadge, type InsertGameBadge,
  type Stats
} from "./shared/schema";  // Path is already correct
import { db } from "./db";
// Remove Drizzle ORM imports since we're not using them anymore
// import { eq, and, or } from "drizzle-orm";
import { SupabaseStorage } from "./supabase-storage";
import { supabase } from "./supabase"; // Aggiungi questa importazione


// Storage interface for all operations
// Aggiorna l'interfaccia IStorage per includere getUserById
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  
  // Game operations
  getAllGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game | undefined>;
  toggleGameStatus(id: number): Promise<Game | undefined>;
  
  // Client operations
  getAllClients(): Promise<any[]>;
  getClient(id: number): Promise<any>;
  getClientById(id: number): Promise<any>;
  getRewardsByClient(clientId: number): Promise<Reward[]>; // Add this missing method
  getUserByEmail(email: string): Promise<any>; // Add this missing method
  getUserById(id: string): Promise<any>;
  verifyPassword?(email: string, password: string): Promise<boolean>;
  supabaseSignIn?(email: string, password: string): Promise<any>;
  
  // Badge operations
  getAllBadges(): Promise<Badge[]>;
  getBadge(id: number): Promise<Badge | undefined>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  
  // Reward operations
  getAllRewards(): Promise<Reward[]>;
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: number, reward: Partial<InsertReward>): Promise<Reward | undefined>;
  deleteReward(id: number): Promise<void>;
  
  // Game-Badge operations
  getGameBadges(gameId: number): Promise<Badge[]>;
  assignBadgeToGame(gameBadge: InsertGameBadge): Promise<GameBadge>;
  removeBadgeFromGame(gameId: number, badgeId: number): Promise<void>;
  
  // Stats operations
  getStats(): Promise<Stats>;
  updateStats(statsData: Partial<Stats>): Promise<Stats>;
}

export class DatabaseStorage implements IStorage {
  // Modifiche per accedere correttamente ai risultati delle query

  async getUserByEmail(email: string): Promise<any> {
    try {
      const result = await db.execute(
        `SELECT * FROM profiles WHERE email = $1 LIMIT 1`,
        [email]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }
  
  // Implementazione del metodo getUserById mancante
  async getUserById(id: string): Promise<any> {
    try {
      const result = await db.execute(
        `SELECT * FROM profiles WHERE id = $1 LIMIT 1`,
        [id]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
  
  async getUser(id: number): Promise<User | undefined> {
    // Replace Drizzle ORM query with raw SQL
    const result = await db.execute(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : undefined;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.execute(
      `SELECT * FROM users WHERE username = $1 LIMIT 1`,
      [username]
    );
    return result.rows.length > 0 ? result.rows[0] : undefined;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const keys = Object.keys(insertUser);
    const values = Object.values(insertUser);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');
    
    const result = await db.execute(
      `INSERT INTO users (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async getAllGames(): Promise<Game[]> {
    const result = await db.execute(`SELECT * FROM games`);
    return result.rows;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const result = await db.execute(
      `SELECT * FROM games WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : undefined;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const keys = Object.keys(game);
    const values = Object.values(game);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');
    
    const result = await db.execute(
      `INSERT INTO games (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    
    // Update stats
    const statsData = await this.getStats();
    
    await db.execute(
      `UPDATE stats SET 
        total_games = $1, 
        active_games = $2, 
        updated_at = $3 
      WHERE id = $4`,
      [
        statsData.totalGames + 1,
        game.isActive ? statsData.activeGames + 1 : statsData.activeGames,
        new Date(),
        statsData.id
      ]
    );
    
    return result.rows[0]; // Modificato da result[0]
  }

  async updateGame(id: number, gameUpdate: Partial<InsertGame>): Promise<Game | undefined> {
    // Get the existing game
    const existingGame = await this.getGame(id);
    
    if (!existingGame) {
      return undefined;
    }
    
    // Track if active status has changed for stats update
    const wasActive = existingGame.isActive;
    const willBeActive = gameUpdate.isActive !== undefined ? gameUpdate.isActive : wasActive;
    
    // Build SET clause for SQL
    const keys = Object.keys(gameUpdate);
    const values = Object.values(gameUpdate);
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    // Update game
    const result = await db.execute(
      `UPDATE games SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    
    // Update stats if active status changed
    if (wasActive !== willBeActive) {
      const statsData = await this.getStats();
      
      await db.execute(
        `UPDATE stats SET 
          active_games = $1, 
          updated_at = $2 
        WHERE id = $3`,
        [
          willBeActive ? statsData.activeGames + 1 : statsData.activeGames - 1,
          new Date(),
          statsData.id
        ]
      );
    }
    
    return result.rows[0]; // Modificato da result[0]
  }

  async toggleGameStatus(id: number): Promise<Game | undefined> {
    // Get the existing game
    const existingGame = await this.getGame(id);
    
    if (!existingGame) {
      return undefined;
    }
    
    // Toggle status
    const newStatus = !existingGame.isActive;
    
    // Update game
    const result = await db.execute(
      `UPDATE games SET is_active = $1 WHERE id = $2 RETURNING *`,
      [newStatus, id]
    );
    
    // Update stats
    const statsData = await this.getStats();
    
    await db.execute(
      `UPDATE stats SET 
        active_games = $1, 
        updated_at = $2 
      WHERE id = $3`,
      [
        newStatus ? statsData.activeGames + 1 : statsData.activeGames - 1,
        new Date(),
        statsData.id
      ]
    );
    
    return result.rows[0]; // Modificato da result[0]
  }

  // Client-related methods fixed to use the imported db module
  async getRewardsByClient(clientId: number): Promise<Reward[]> {
    const result = await db.execute(
      'SELECT * FROM rewards WHERE client_id = $1 ORDER BY name',
      [clientId]
    );
    return result.rows;
  }
  
  // Aggiungi questo metodo alla classe DatabaseStorage
  async getClient(id: number) {
    try {
      const result = await db.execute(
        'SELECT * FROM clients WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting client:', error);
      throw error;
    }
  }
  
  async getClientById(id: number): Promise<any> {
    const result = await db.execute(
      'SELECT id, name, logo_url, created_at, updated_at FROM clients WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }
  
  async getAllClients(): Promise<any[]> {
    console.log('[Storage] Getting all clients');
    try {
      const result = await db.execute(
        'SELECT id, name, logo_url, created_at, updated_at FROM clients ORDER BY name'
      );
      console.log('[Storage] Clients query result:', result);
      console.log('[Storage] Clients found:', result.rows);
      return result.rows;
    } catch (error) {
      console.error('[Storage] Error getting all clients:', error);
      return [];
    }
  }

  async getAllBadges(): Promise<Badge[]> {
    const result = await db.execute(`SELECT * FROM badges`);
    return result.rows;
  }

  async getBadge(id: number): Promise<Badge | undefined> {
    const result = await db.execute(
      `SELECT * FROM badges WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : undefined;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const keys = Object.keys(badge);
    const values = Object.values(badge);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');
    
    const result = await db.execute(
      `INSERT INTO badges (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async getAllRewards(): Promise<Reward[]> {
    const result = await db.execute(`SELECT * FROM rewards`);
    return result.rows;
  }

  async getReward(id: number): Promise<Reward | undefined> {
    const result = await db.execute(
      `SELECT * FROM rewards WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows.length > 0 ? result.rows[0] : undefined;
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    // Convertiamo i campi problematici
    const processedReward = { ...reward };
    
    // Assicuriamoci che feltrinelliRewardId sia una stringa
    if (processedReward.feltrinelliRewardId !== undefined) {
      processedReward.feltrinelliRewardId = processedReward.feltrinelliRewardId.toString();
    }
    
    const keys = Object.keys(processedReward);
    const values = Object.values(processedReward);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');
    
    try {
      const result = await db.execute(
        `INSERT INTO rewards (${columns}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating reward:', error);
      throw error;
    }
  }

  async updateReward(id: number, rewardUpdate: Partial<InsertReward>): Promise<Reward | undefined> {
    // Get existing reward
    const existingReward = await this.getReward(id);
    
    if (!existingReward) {
      return undefined;
    }
    
    // Convertiamo i campi problematici
    const processedUpdate = { ...rewardUpdate };
    
    // Assicuriamoci che feltrinelliRewardId sia una stringa
    if (processedUpdate.feltrinelliRewardId !== undefined) {
      processedUpdate.feltrinelliRewardId = processedUpdate.feltrinelliRewardId.toString();
    }
    
    // Build SET clause for SQL
    const keys = Object.keys(processedUpdate);
    const values = Object.values(processedUpdate);
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    try {
      // Update reward
      const result = await db.execute(
        `UPDATE rewards SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating reward:', error);
      throw error;
    }
  }

  async deleteReward(id: number): Promise<void> {
    await db.execute(
      `DELETE FROM rewards WHERE id = $1`,
      [id]
    );
  }

  async getGameBadges(gameId: number): Promise<Badge[]> {
    const badgeRelations = await db.execute(
      `SELECT * FROM game_badges WHERE game_id = $1`,
      [gameId]
    );
    
    if (badgeRelations.rows.length === 0) {
      return [];
    }
    
    // Aggiornato per utilizzare snake_case come nel database
    const badgeIds = badgeRelations.rows.map((rel: { badge_id: number }) => rel.badge_id);
    const placeholders = badgeIds.map((_: number, i: number) => `$${i + 1}`).join(', ');
    
    const badgeList = await db.execute(
      `SELECT * FROM badges WHERE id IN (${placeholders})`,
      badgeIds
    );
    
    return badgeList.rows;
  }

  async assignBadgeToGame(gameBadge: InsertGameBadge): Promise<GameBadge> {
    // Check if already exists
    const existing = await db.execute(
      `SELECT * FROM game_badges WHERE game_id = $1 AND badge_id = $2 LIMIT 1`,
      [gameBadge.gameId, gameBadge.badgeId]
    );
    
    if (existing.rows.length > 0) {
      throw new Error("Badge already assigned to this game");
    }
    
    const result = await db.execute(
      `INSERT INTO game_badges (game_id, badge_id) VALUES ($1, $2) RETURNING *`,
      [gameBadge.gameId, gameBadge.badgeId]
    );
    
    return result.rows[0];
  }
  
  // Implementazione del metodo mancante
  async removeBadgeFromGame(gameId: number, badgeId: number): Promise<void> {
    await db.execute(
      `DELETE FROM game_badges WHERE game_id = $1 AND badge_id = $2`,
      [gameId, badgeId]
    );
  }

  async getStats(): Promise<Stats> {
    const result = await db.execute(
      `SELECT * FROM stats LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      // Initialize stats if they don't exist
      const newStats = await db.execute(
        `INSERT INTO stats (total_games, active_games, active_users, awarded_badges) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [0, 0, 0, 0]
      );
      
      return newStats.rows[0];
    }
    
    return result.rows[0];
  }

  async updateStats(statsUpdate: Partial<Stats>): Promise<Stats> {
    const statsData = await this.getStats();
    
    if (!statsData) {
      // Initialize stats if they don't exist with the provided updates
      const newStats = await db.execute(
        `INSERT INTO stats (total_games, active_games, active_users, awarded_badges) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [
          statsUpdate.totalGames || 0,
          statsUpdate.activeGames || 0,
          statsUpdate.activeUsers || 0,
          statsUpdate.awardedBadges || 0
        ]
      );
      
      return newStats.rows[0]; // Modificato da newStats[0]
    }
    
    // Build SET clause for SQL
    const keys = Object.keys(statsUpdate);
    const values = Object.values(statsUpdate);
    const setClauses = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    // Update existing stats
    const result = await db.execute(
      `UPDATE stats SET ${setClauses}, updated_at = $${keys.length + 1} WHERE id = $${keys.length + 2} RETURNING *`,
      [...values, new Date(), statsData.id]
    );
    
    return result.rows[0];
  }
}




// Scegli l'implementazione da utilizzare
// Abilitiamo Supabase se sono configurate le variabili d'ambiente necessarie
// o se siamo in ambiente di produzione
const isProduction = process.env.NODE_ENV === 'production';

console.log(`[Storage] Checking connection in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} environment`);
console.log(`[Storage] SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Present' : 'Missing'}`);
console.log(`[Storage] SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing'}`);
console.log(`[Storage] DATABASE_URL: ${process.env.DATABASE_URL ? 'Present' : 'Missing'}`);

// In produzione, forziamo l'utilizzo di Supabase
if (isProduction && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.log('[Storage] Production environment detected with missing Supabase credentials');
  console.log('[Storage] Setting hardcoded Supabase credentials for production');
  process.env.SUPABASE_URL = 'https://hdguwqhxbqssdtqgilmy.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ3V3cWh4YnFzc2R0cWdpbG15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDAwNzYxMSwiZXhwIjoyMDU5NTgzNjExfQ.JMMjfy1Vwj4QG_VBSUqlortWzQgcDn-Qod8gEy-l6rQ';
}

// Forziamo l'uso di Supabase indipendentemente dall'ambiente
console.log('[Storage] Forcing Supabase Storage usage');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://hdguwqhxbqssdtqgilmy.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZ3V3cWh4YnFzc2R0cWdpbG15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDAwNzYxMSwiZXhwIjoyMDU5NTgzNjExfQ.JMMjfy1Vwj4QG_VBSUqlortWzQgcDn-Qod8gEy-l6rQ';

// Ricontrolliamo se abbiamo le credenziali Supabase ora
const useSupabase = true; // Forziamo l'uso di Supabase

let selectedStorage: IStorage;

try {
  if (useSupabase) {
    console.log('[Storage] Configurando Supabase Storage...');
    selectedStorage = new SupabaseStorage();
    
    // Aggiungiamo un test per verificare che selectedStorage sia effettivamente SupabaseStorage
    console.log('[Storage] Storage type:', selectedStorage.constructor.name);
    
    // Test diretto per verificare se possiamo recuperare i clienti
    selectedStorage.getAllClients().then(clients => {
      console.log('[Storage] Direct test - Clients found:', clients);
    }).catch(err => {
      console.error('[Storage] Direct test - Error getting clients:', err);
    });
    
    console.log('[Storage] Supabase Storage configurato correttamente');
  } else if (process.env.DATABASE_URL) {
    console.log('[Storage] Configurando Database Storage con PostgreSQL...');
    selectedStorage = new DatabaseStorage();
    console.log('[Storage] Database Storage configurato correttamente');
  } else {
    console.warn('[Storage] Nessuna variabile d\'ambiente di connessione al database trovata');
    console.warn('[Storage] Utilizzando Database Storage con connessione di default');
    selectedStorage = new DatabaseStorage();
  }
} catch (error) {
  console.error('[Storage] Errore nella configurazione dello storage:', error);
  console.warn('[Storage] Ripiegando su Database Storage...');
  selectedStorage = new DatabaseStorage();
}

try {
  console.log('[Storage] Esecuzione test di connessione Supabase...');
  supabase.from('clients').select('count').then(({ data, error }) => {
    if (error) {
      console.error('[Storage] Test connessione Supabase fallito:', error);
    } else {
      console.log('[Storage] Test connessione Supabase riuscito:', data);
    }
  });
} catch (error) {
  console.error('[Storage] Errore nel test di connessione Supabase:', error);
}

// Esportiamo lo storage selezionato
export const storage = selectedStorage;


