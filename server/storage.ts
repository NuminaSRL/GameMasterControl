import {
  users, type User, type InsertUser,
  games, type Game, type InsertGame,
  badges, type Badge, type InsertBadge,
  rewards, type Reward, type InsertReward,
  gameBadges, type GameBadge, type InsertGameBadge,
  stats, type Stats
} from "./shared/schema.js";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";
import { SupabaseStorage } from "./supabase-storage";

// Storage interface for all operations
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
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games);
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db
      .insert(games)
      .values(game)
      .returning();
    
    // Update stats
    const [statsData] = await db.select().from(stats).limit(1);
    
    if (statsData) {
      await db
        .update(stats)
        .set({
          totalGames: statsData.totalGames + 1,
          activeGames: game.isActive ? statsData.activeGames + 1 : statsData.activeGames,
          updatedAt: new Date()
        })
        .where(eq(stats.id, statsData.id));
    } else {
      // Initialize stats if they don't exist
      await db
        .insert(stats)
        .values({
          totalGames: 1,
          activeGames: game.isActive ? 1 : 0,
          activeUsers: 0,
          awardedBadges: 0
        });
    }
    
    return newGame;
  }

  async updateGame(id: number, gameUpdate: Partial<InsertGame>): Promise<Game | undefined> {
    // Get the existing game
    const [existingGame] = await db
      .select()
      .from(games)
      .where(eq(games.id, id));
    
    if (!existingGame) {
      return undefined;
    }
    
    // Track if active status has changed for stats update
    const wasActive = existingGame.isActive;
    const willBeActive = gameUpdate.isActive !== undefined ? gameUpdate.isActive : wasActive;
    
    // Update game
    const [updatedGame] = await db
      .update(games)
      .set(gameUpdate)
      .where(eq(games.id, id))
      .returning();
    
    // Update stats if active status changed
    if (wasActive !== willBeActive) {
      const [statsData] = await db.select().from(stats).limit(1);
      
      if (statsData) {
        await db
          .update(stats)
          .set({
            activeGames: willBeActive ? statsData.activeGames + 1 : statsData.activeGames - 1,
            updatedAt: new Date()
          })
          .where(eq(stats.id, statsData.id));
      }
    }
    
    return updatedGame;
  }

  async toggleGameStatus(id: number): Promise<Game | undefined> {
    // Get the existing game
    const [existingGame] = await db
      .select()
      .from(games)
      .where(eq(games.id, id));
    
    if (!existingGame) {
      return undefined;
    }
    
    // Toggle status
    const newStatus = !existingGame.isActive;
    
    // Update game
    const [updatedGame] = await db
      .update(games)
      .set({ isActive: newStatus })
      .where(eq(games.id, id))
      .returning();
    
    // Update stats
    const [statsData] = await db.select().from(stats).limit(1);
    
    if (statsData) {
      await db
        .update(stats)
        .set({
          activeGames: newStatus ? statsData.activeGames + 1 : statsData.activeGames - 1,
          updatedAt: new Date()
        })
        .where(eq(stats.id, statsData.id));
    }
    
    return updatedGame;
  }

  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge || undefined;
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    const [newBadge] = await db
      .insert(badges)
      .values(badge)
      .returning();
    return newBadge;
  }

  async getAllRewards(): Promise<Reward[]> {
    return await db.select().from(rewards);
  }

  async getReward(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward || undefined;
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db
      .insert(rewards)
      .values(reward)
      .returning();
    return newReward;
  }

  async updateReward(id: number, rewardUpdate: Partial<InsertReward>): Promise<Reward | undefined> {
    // Get existing reward
    const [existingReward] = await db
      .select()
      .from(rewards)
      .where(eq(rewards.id, id));
    
    if (!existingReward) {
      return undefined;
    }
    
    // Update reward
    const [updatedReward] = await db
      .update(rewards)
      .set(rewardUpdate)
      .where(eq(rewards.id, id))
      .returning();
    
    return updatedReward;
  }

  async deleteReward(id: number): Promise<void> {
    await db
      .delete(rewards)
      .where(eq(rewards.id, id));
  }

  async getGameBadges(gameId: number): Promise<Badge[]> {
    const badgeRelations = await db
      .select()
      .from(gameBadges)
      .where(eq(gameBadges.gameId, gameId));
    
    if (badgeRelations.length === 0) {
      return [];
    }
    
    const badgeIds = badgeRelations.map(rel => rel.badgeId);
    
    const badgeList = await db
      .select()
      .from(badges)
      .where(
        badgeIds.map(id => eq(badges.id, id)).reduce((acc, curr) => acc || curr)
      );
    
    return badgeList;
  }

  async assignBadgeToGame(gameBadge: InsertGameBadge): Promise<GameBadge> {
    // Check if already exists
    const [existing] = await db
      .select()
      .from(gameBadges)
      .where(
        and(
          eq(gameBadges.gameId, gameBadge.gameId),
          eq(gameBadges.badgeId, gameBadge.badgeId)
        )
      );
    
    if (existing) {
      throw new Error("Badge already assigned to this game");
    }
    
    const [newGameBadge] = await db
      .insert(gameBadges)
      .values(gameBadge)
      .returning();
    
    return newGameBadge;
  }

  async removeBadgeFromGame(gameId: number, badgeId: number): Promise<void> {
    await db
      .delete(gameBadges)
      .where(
        and(
          eq(gameBadges.gameId, gameId),
          eq(gameBadges.badgeId, badgeId)
        )
      );
  }

  async getStats(): Promise<Stats> {
    const [statsData] = await db.select().from(stats).limit(1);
    
    if (!statsData) {
      // Initialize stats if they don't exist
      const [newStats] = await db
        .insert(stats)
        .values({
          totalGames: 0,
          activeGames: 0,
          activeUsers: 0,
          awardedBadges: 0
        })
        .returning();
      
      return newStats;
    }
    
    return statsData;
  }

  async updateStats(statsUpdate: Partial<Stats>): Promise<Stats> {
    const [statsData] = await db.select().from(stats).limit(1);
    
    if (!statsData) {
      // Initialize stats if they don't exist with the provided updates
      const [newStats] = await db
        .insert(stats)
        .values({
          totalGames: statsUpdate.totalGames || 0,
          activeGames: statsUpdate.activeGames || 0,
          activeUsers: statsUpdate.activeUsers || 0,
          awardedBadges: statsUpdate.awardedBadges || 0,
        })
        .returning();
      
      return newStats;
    }
    
    // Update existing stats
    const [updatedStats] = await db
      .update(stats)
      .set({ ...statsUpdate, updatedAt: new Date() })
      .where(eq(stats.id, statsData.id))
      .returning();
    
    return updatedStats;
  }
}

// Scegli l'implementazione da utilizzare
// Abilitiamo Supabase se sono configurate le variabili d'ambiente necessarie
// IMPORTANTE: Prima di attivare Supabase, assicurati di aver eseguito manualmente
// il file migration-script.sql nell'SQL Editor della dashboard di Supabase
const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

// Variabile che determina quale storage usare
// Se è presente solo DATABASE_URL, usa DatabaseStorage
// Se sono presenti SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY, usa SupabaseStorage
// Di default, usa DatabaseStorage se nessuna variabile è configurata

let selectedStorage: IStorage;

try {
  if (useSupabase) {
    console.log('Configurando Supabase Storage...');
    selectedStorage = new SupabaseStorage();
    console.log('Supabase Storage configurato correttamente');
  } else if (process.env.DATABASE_URL) {
    console.log('Configurando Database Storage con PostgreSQL...');
    selectedStorage = new DatabaseStorage();
    console.log('Database Storage configurato correttamente');
  } else {
    console.warn('Nessuna variabile d\'ambiente di connessione al database trovata');
    console.warn('Utilizzando Database Storage con connessione di default');
    selectedStorage = new DatabaseStorage();
  }
} catch (error) {
  console.error('Errore nella configurazione dello storage:', error);
  console.warn('Ripiegando su Database Storage...');
  selectedStorage = new DatabaseStorage();
}

// Esporta la classe storage appropriata
export const storage: IStorage = selectedStorage;
