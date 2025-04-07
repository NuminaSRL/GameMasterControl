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

/**
 * Implementazione di IStorage che utilizza Supabase
 */
export class SupabaseStorage implements IStorage {
  // === User operations ===
  
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([insertUser])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return formatDates(data) as User;
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
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('id');
    
    if (error) throw new Error(`Failed to fetch badges: ${error.message}`);
    return (data || []).map(badge => formatDates(this._mapDbBadgeToSchema(badge)));
  }

  async getBadge(id: number): Promise<Badge | undefined> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return formatDates(this._mapDbBadgeToSchema(data));
  }

  async createBadge(badge: InsertBadge): Promise<Badge> {
    // Convert to DB format
    const dbBadge = this._mapSchemaBadgeToDb(badge);
    
    const { data, error } = await supabase
      .from('badges')
      .insert([dbBadge])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create badge: ${error.message}`);
    return formatDates(this._mapDbBadgeToSchema(data));
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

  // === Game-Badge operations ===
  
  async getGameBadges(gameId: number): Promise<Badge[]> {
    const { data: gameBadgeRelations, error } = await supabase
      .from('game_badges')
      .select('badge_id')
      .eq('game_id', gameId);
    
    if (error) throw new Error(`Failed to fetch game badges: ${error.message}`);
    
    if (gameBadgeRelations.length === 0) {
      return [];
    }
    
    const badgeIds = gameBadgeRelations.map(rel => rel.badge_id);
    
    const { data: badgeList } = await supabase
      .from('badges')
      .select('*')
      .in('id', badgeIds);
    
    return (badgeList || []).map(badge => formatDates(this._mapDbBadgeToSchema(badge)));
  }

  async assignBadgeToGame(gameBadge: InsertGameBadge): Promise<GameBadge> {
    // Check if already exists
    const { data: existing, error: checkError } = await supabase
      .from('game_badges')
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
      .from('game_badges')
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
      .from('game_badges')
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