import { supabase } from '../../../supabase';
import { Game, GameSettings } from '../models/game.model';

/**
 * Servizio per la gestione dei giochi Feltrinelli
 */
export class GameService {
  constructor() {
    console.log('🔍 INITIALIZED: GameService from clients/feltrinelli/services/game-service.ts');
  }

  /**
   * Recupera tutti i giochi disponibili
   */
  async getAllGames(): Promise<Game[]> {
    try {
      console.log('📣 CALLED: getAllGames from clients/feltrinelli/services/game-service.ts');
      const { data, error } = await supabase
        .from('flt_games')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return data?.map(game => ({
        id: game.id,
        feltrinelli_id: game.feltrinelli_id,
        name: game.name,
        description: game.description,
        is_active: game.is_active,
        created_at: game.created_at,
        settings: game.settings || {}
      })) || [];
    } catch (error) {
      console.error('[GameService] Error fetching all games:', error);
      throw error;
    }
  }

  // Add similar logging to other methods
  async getGame(id: string): Promise<Game> {
    try {
      console.log(`📣 CALLED: getGame(${id}) from clients/feltrinelli/services/game-service.ts`);
      const { data, error } = await supabase
        .from('flt_games')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error(`Game with ID ${id} not found`);
      
      return {
        id: data.id,
        feltrinelli_id: data.feltrinelli_id,
        name: data.name,
        description: data.description,
        is_active: data.is_active,
        created_at: data.created_at,
        settings: data.settings || {}
      };
    } catch (error) {
      console.error(`[GameService] Error fetching game with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Recupera le impostazioni di un gioco
   * @param gameId ID del gioco
   */
  async getGameSettings(gameId: string): Promise<GameSettings> {
    try {
      const { data, error } = await supabase
        .from('flt_games')
        .select('settings')
        .eq('id', gameId)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error(`Game with ID ${gameId} not found`);
      
      return data.settings || {};
    } catch (error) {
      console.error(`[GameService] Error fetching settings for game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Recupera tutti i badge di un gioco
   * @param gameId ID del gioco
   */
  async getGameBadges(gameId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('flt_badges')
        .select('*')
        .eq('game_id', gameId)
        .eq('is_active', true)
        .order('points_required', { ascending: true });
      
      if (error) throw error;
      
      return data?.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        image_url: badge.image_url,
        points_required: badge.points_required,
        game_id: badge.game_id,
        is_active: badge.is_active,
        created_at: badge.created_at
      })) || [];
    } catch (error) {
      console.error(`[GameService] Error fetching badges for game ${gameId}:`, error);
      throw error;
    }
  }
}

// Esporta un'istanza singleton del servizio
export const gameService = new GameService();