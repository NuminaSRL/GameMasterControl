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
  async getAllGames() {
    try {
      // Recupera i giochi dalla tabella flt_games
      const { data, error } = await supabase
        .from('flt_games')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('[GameService] Error fetching games:', error);
        throw error;
      }
      
      // Recupera le impostazioni per tutti i giochi
      const gameIds = data.map(game => game.id);
      const { data: settingsData, error: settingsError } = await supabase
        .from('flt_game_settings')
        .select('*')
        .in('game_id', gameIds);
      
      if (settingsError) {
        console.error('[GameService] Error fetching game settings:', settingsError);
        // Non interrompiamo l'esecuzione, continuiamo
      }
      
      // Crea una mappa delle impostazioni per un accesso più veloce
      const settingsMap: { [key: string]: any } = {};
      if (settingsData) {
        settingsData.forEach(setting => {
          settingsMap[setting.game_id] = setting;
        });
      }
      
      // Assicurati che i campi siano mappati correttamente
      const formattedGames = data.map(game => {
        const gameSettings = settingsMap[game.id] || {};
        return {
          ...game,
          isActive: game.is_active, // Aggiungi esplicitamente isActive
          settings: gameSettings
        };
      });
      
      console.log('[GameService] Giochi formattati:', formattedGames);
      return formattedGames;
    } catch (error) {
      console.error('[GameService] Error in getAllGames:', error);
      throw error;
    }
  }

  // Add similar logging to other methods
  async getGame(id: string): Promise<Game> {
    try {
      console.log(`📣 CALLED: getGame(${id}) from clients/feltrinelli/services/game-service.ts`);
      
      // Recupera il gioco
      const { data, error } = await supabase
        .from('flt_games')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error(`Game with ID ${id} not found`);
      
      // Recupera le impostazioni del gioco
      const { data: settings, error: settingsError } = await supabase
        .from('flt_game_settings')
        .select('*')
        .eq('game_id', id)
        .maybeSingle();
      
      if (settingsError) {
        console.error(`[GameService] Error fetching settings for game ${id}:`, settingsError);
        // Non interrompiamo l'esecuzione, continuiamo
      }
      
      return {
        id: data.id,
        feltrinelli_id: data.feltrinelli_id,
        name: data.name,
        description: data.description,
        is_active: data.is_active,
        created_at: data.created_at,
        settings: settings || {}
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
      // Recupera le informazioni del gioco
      const { data: gameData, error: gameError } = await supabase
        .from('flt_games')
        .select('*')
        .eq('id', gameId)
        .single();
      
      if (gameError) {
        console.error(`[GameService] Error fetching game data:`, gameError);
        throw gameError;
      }
      
      // Recupera le impostazioni del gioco
      const { data: settingsData, error: settingsError } = await supabase
        .from('flt_game_settings')
        .select('*')
        .eq('game_id', gameId)
        .maybeSingle();
      
      if (settingsError) {
        console.error(`[GameService] Error fetching game settings:`, settingsError);
        // Non interrompiamo l'esecuzione, continuiamo con i dati del gioco
      }
      
      // Combina i dati per la risposta
      const response = {
        id: gameId,
        name: gameData.name,
        description: gameData.description || '',
        isActive: gameData.is_active,
        weeklyLeaderboard: gameData.weekly_leaderboard,
        monthlyLeaderboard: gameData.monthly_leaderboard,
        gameType: gameData.game_type,
        feltrinelliGameId: gameData.feltrinelli_id,
        timerDuration: settingsData?.timer_duration ?? 30,
        questionCount: settingsData?.question_count ?? 10,
        difficulty: settingsData?.difficulty ?? 1,
        settings: {
          timerDuration: settingsData?.timer_duration ?? 30,
          questionCount: settingsData?.question_count ?? 10,
          difficulty: settingsData?.difficulty ?? 1
        },
        createdAt: gameData.created_at,
        updatedAt: gameData.updated_at || settingsData?.updated_at
      };
      
      return response;
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

  /**
   * Aggiorna le impostazioni di un gioco
   */
  async updateGameSettings(gameId: string, settings: any) {
    console.log('[GameService] Updating settings for game:', gameId, settings);
    
    try {
      // Separa i campi in base alla tabella a cui appartengono
      const gameFields: any = {};
      const settingsFields: any = {
        game_id: gameId,
        updated_at: new Date()
      };
      
      // Campi che appartengono a flt_games
      if (settings.name !== undefined) gameFields.name = settings.name;
      if (settings.description !== undefined) gameFields.description = settings.description;
      if (settings.isActive !== undefined) gameFields.is_active = settings.isActive;
      if (settings.weeklyLeaderboard !== undefined) gameFields.weekly_leaderboard = settings.weeklyLeaderboard;
      if (settings.monthlyLeaderboard !== undefined) gameFields.monthly_leaderboard = settings.monthlyLeaderboard;
      if (settings.gameType !== undefined) gameFields.game_type = settings.gameType;
      if (settings.feltrinelliGameId !== undefined) gameFields.feltrinelli_id = settings.feltrinelliGameId;
      
      // Campi che appartengono a flt_game_settings
      if (settings.timerDuration !== undefined) settingsFields.timer_duration = settings.timerDuration;
      if (settings.questionCount !== undefined) settingsFields.question_count = settings.questionCount;
      if (settings.difficulty !== undefined) settingsFields.difficulty = settings.difficulty;
      
      // Aggiorna i campi in flt_games se necessario
      if (Object.keys(gameFields).length > 0) {
        console.log('[GameService] Updating game fields in flt_games:', gameFields);
        
        const { error: gameError } = await supabase
          .from('flt_games')
          .update(gameFields)
          .eq('id', gameId);
        
        if (gameError) {
          console.error('[GameService] Error updating game:', gameError);
          throw gameError;
        }
      }
      
      // Aggiorna i campi in flt_game_settings
      console.log('[GameService] Updating settings fields in flt_game_settings:', settingsFields);
      
      // Verifica se esistono già impostazioni per questo gioco
      const { data: existingSettings, error: checkError } = await supabase
        .from('flt_game_settings')
        .select('*')
        .eq('game_id', gameId)
        .maybeSingle();
      
      if (checkError) {
        console.error('[GameService] Error checking existing settings:', checkError);
        throw checkError;
      }
      
      if (existingSettings) {
        // Aggiorna le impostazioni esistenti
        const { error: updateError } = await supabase
          .from('flt_game_settings')
          .update(settingsFields)
          .eq('game_id', gameId);
        
        if (updateError) {
          console.error('[GameService] Error updating settings:', updateError);
          throw updateError;
        }
      } else {
        // Crea nuove impostazioni con valori predefiniti per i campi mancanti
        if (settingsFields.timer_duration === undefined) settingsFields.timer_duration = 30;
        if (settingsFields.question_count === undefined) settingsFields.question_count = 10;
        if (settingsFields.difficulty === undefined) settingsFields.difficulty = 1;
        settingsFields.created_at = new Date();
        
        const { error: insertError } = await supabase
          .from('flt_game_settings')
          .insert(settingsFields);
        
        if (insertError) {
          console.error('[GameService] Error creating settings:', insertError);
          throw insertError;
        }
      }
      
      // Recupera i dati aggiornati per la risposta
      const { data: gameData, error: gameDataError } = await supabase
        .from('flt_games')
        .select('*')
        .eq('id', gameId)
        .single();
      
      if (gameDataError) {
        console.error('[GameService] Error fetching updated game data:', gameDataError);
        throw gameDataError;
      }
      
      const { data: settingsData, error: settingsDataError } = await supabase
        .from('flt_game_settings')
        .select('*')
        .eq('game_id', gameId)
        .maybeSingle();
      
      if (settingsDataError) {
        console.error('[GameService] Error fetching updated settings data:', settingsDataError);
        // Non interrompiamo l'esecuzione, continuiamo con i dati del gioco
      }
      
      // Combina i dati per la risposta
      const response = {
        id: gameId,
        name: gameData.name,
        description: gameData.description || '',
        isActive: gameData.is_active,
        weeklyLeaderboard: gameData.weekly_leaderboard,
        monthlyLeaderboard: gameData.monthly_leaderboard,
        gameType: gameData.game_type,
        feltrinelliGameId: gameData.feltrinelli_id,
        timerDuration: settingsData?.timer_duration ?? 30,
        questionCount: settingsData?.question_count ?? 10,
        difficulty: settingsData?.difficulty ?? 1,
        settings: {
          timerDuration: settingsData?.timer_duration ?? 30,
          questionCount: settingsData?.question_count ?? 10,
          difficulty: settingsData?.difficulty ?? 1
        },
        createdAt: gameData.created_at,
        updatedAt: gameData.updated_at
      };
      
      return response;
    } catch (error) {
      console.error('[GameService] Error updating settings:', error);
      throw error;
    }
  }
}

// Esporta un'istanza singleton del servizio
export const gameService = new GameService();