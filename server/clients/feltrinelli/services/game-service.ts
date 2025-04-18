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
      console.log('[GameService] Fetching all games with settings');
      
      // Recupera i giochi e le impostazioni in un'unica query con join
      const { data, error } = await supabase
        .from('flt_games')
        .select(`
          *,
          settings:flt_game_settings (*)
        `)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('[GameService] Error fetching games with settings:', error);
        throw error;
      }
      
      // Formatta i dati per il frontend (struttura consistente)
      const formattedGames = data.map(game => {
        const settings = Array.isArray(game.settings) ? game.settings[0] : game.settings;
        
        return {
          id: game.id,
          name: game.name,
          description: game.description || '',
          isActive: game.is_active,
          imageUrl: game.image_url || '',
          // Questi campi ora vengono presi da settings
          weeklyLeaderboard: settings?.weekly_leaderboard ?? false,
          monthlyLeaderboard: settings?.monthly_leaderboard ?? false,
          gameType: settings?.game_type || 'books',
          feltrinelliGameId: game.feltrinelli_id,
          // Valori dalle impostazioni con fallback
          timerDuration: settings?.timer_duration ?? 30,
          questionCount: settings?.question_count ?? 10,
          difficulty: settings?.difficulty ?? 1,
          // Campi aggiuntivi per compatibilità - aggiungi anche i campi mancanti
          settings: {
            timerDuration: settings?.timer_duration ?? 30,
            questionCount: settings?.question_count ?? 10,
            difficulty: settings?.difficulty ?? 1,
            weeklyLeaderboard: settings?.weekly_leaderboard ?? false,
            monthlyLeaderboard: settings?.monthly_leaderboard ?? false,
            gameType: settings?.game_type || 'books'
          },
          createdAt: game.created_at,
          updatedAt: game.updated_at || settings?.updated_at
        };
      });
      
      console.log(`[GameService] Retrieved ${formattedGames.length} games with formatted settings`);
      console.log('[GameService] Sample game data:', formattedGames[0]);
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
        // Prendi questi valori da settingsData invece che da gameData
        weeklyLeaderboard: settingsData?.weekly_leaderboard ?? false,
        monthlyLeaderboard: settingsData?.monthly_leaderboard ?? false,
        gameType: settingsData?.game_type || 'books',
        feltrinelliGameId: gameData.feltrinelli_id,
        timerDuration: settingsData?.timer_duration ?? 30,
        questionCount: settingsData?.question_count ?? 10,
        difficulty: settingsData?.difficulty ?? 1,
        settings: {
          timerDuration: settingsData?.timer_duration ?? 30,
          questionCount: settingsData?.question_count ?? 10,
          difficulty: settingsData?.difficulty ?? 1,
          weeklyLeaderboard: settingsData?.weekly_leaderboard ?? false,
          monthlyLeaderboard: settingsData?.monthly_leaderboard ?? false,
          gameType: settingsData?.game_type || 'books'
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
      const gameFields: any = {};
      const settingsFields: any = {}; // Inizializza vuoto

      // Popola gameFields (tabella flt_games)
      if (settings.name !== undefined) gameFields.name = settings.name;
      if (settings.description !== undefined) gameFields.description = settings.description;
      if (settings.isActive !== undefined) gameFields.is_active = Boolean(settings.isActive);
      if (settings.is_active !== undefined) gameFields.is_active = Boolean(settings.is_active);
      if (settings.feltrinelliGameId !== undefined) gameFields.feltrinelli_id = settings.feltrinelliGameId;
      if (settings.feltrinelli_id !== undefined) gameFields.feltrinelli_id = settings.feltrinelli_id;

      // Popola settingsFields (tabella flt_game_settings)
      // Sposta i campi che appartengono a flt_game_settings
      if (settings.weeklyLeaderboard !== undefined) settingsFields.weekly_leaderboard = Boolean(settings.weeklyLeaderboard);
      if (settings.weekly_leaderboard !== undefined) settingsFields.weekly_leaderboard = Boolean(settings.weekly_leaderboard);
      if (settings.monthlyLeaderboard !== undefined) settingsFields.monthly_leaderboard = Boolean(settings.monthlyLeaderboard);
      if (settings.monthly_leaderboard !== undefined) settingsFields.monthly_leaderboard = Boolean(settings.monthly_leaderboard);
      if (settings.gameType !== undefined) settingsFields.game_type = settings.gameType;
      if (settings.game_type !== undefined) settingsFields.game_type = settings.game_type;
      
      // Controlla sia timerDuration (frontend) che timer_duration (API diretta)
      if (settings.timerDuration !== undefined) {
        settingsFields.timer_duration = Number(settings.timerDuration);
        console.log(`[GameService] Setting timer_duration to ${settingsFields.timer_duration} from timerDuration=${settings.timerDuration}`);
      } else if (settings.timer_duration !== undefined) {
        settingsFields.timer_duration = Number(settings.timer_duration);
        console.log(`[GameService] Setting timer_duration to ${settingsFields.timer_duration} from timer_duration=${settings.timer_duration}`);
      }
      
      // Controlla sia questionCount (frontend) che question_count (API diretta)
      if (settings.questionCount !== undefined) {
        settingsFields.question_count = Number(settings.questionCount);
        console.log(`[GameService] Setting question_count to ${settingsFields.question_count} from questionCount=${settings.questionCount}`);
      } else if (settings.question_count !== undefined) {
        settingsFields.question_count = Number(settings.question_count);
        console.log(`[GameService] Setting question_count to ${settingsFields.question_count} from question_count=${settings.question_count}`);
      }
      
      // Controlla sia difficulty (frontend) che difficulty (API diretta)
      if (settings.difficulty !== undefined) {
        settingsFields.difficulty = Number(settings.difficulty);
        console.log(`[GameService] Setting difficulty to ${settingsFields.difficulty} from difficulty=${settings.difficulty}`);
      }

      console.log('[GameService] Processed fields:', { gameFields, settingsFields });

      // Aggiorna flt_games se ci sono campi
      if (Object.keys(gameFields).length > 0) {
        gameFields.updated_at = new Date().toISOString(); // Aggiungi timestamp
        console.log('[GameService] Updating flt_games with:', gameFields);
        const { error: gameError } = await supabase
          .from('flt_games')
          .update(gameFields)
          .eq('id', gameId);

        if (gameError) {
          console.error('[GameService] Error updating flt_games:', gameError);
          throw gameError;
        }
        console.log('[GameService] flt_games updated successfully.');
      }

      // Aggiorna o inserisci flt_game_settings se ci sono campi
      if (Object.keys(settingsFields).length > 0) {
        settingsFields.updated_at = new Date().toISOString(); // Usa formato ISO per timestamp
        console.log('[GameService] Upserting flt_game_settings with:', settingsFields);

        // Verifica se esiste già un record per questo gioco
        const { data: existingSettings } = await supabase
          .from('flt_game_settings')
          .select('*')
          .eq('game_id', gameId)
          .maybeSingle();

        if (existingSettings) {
          // Aggiorna il record esistente
          console.log(`[GameService] Updating existing settings for game ${gameId}:`, settingsFields);
          const { data: updatedSettings, error: updateError } = await supabase
            .from('flt_game_settings')
            .update(settingsFields)
            .eq('game_id', gameId)
            .select();

          if (updateError) {
            console.error('[GameService] Error updating flt_game_settings:', updateError);
            throw updateError;
          }
          console.log('[GameService] Updated settings:', updatedSettings);
        } else {
          // Inserisci un nuovo record
          settingsFields.game_id = gameId; // Assicurati che game_id sia impostato
          settingsFields.is_active = true; // Imposta is_active a true per i nuovi record
          console.log(`[GameService] Creating new settings for game ${gameId}:`, settingsFields);
          const { data: newSettings, error: insertError } = await supabase
            .from('flt_game_settings')
            .insert(settingsFields)
            .select();

          if (insertError) {
            console.error('[GameService] Error inserting flt_game_settings:', insertError);
            throw insertError;
          }
          console.log('[GameService] Inserted new settings:', newSettings);
        }
        
        console.log('[GameService] flt_game_settings updated successfully.');
      }

      // Il resto del metodo rimane invariato
      // ...

      // Recupera e restituisci i dati combinati aggiornati
      console.log('[GameService] Fetching combined updated game data for ID:', gameId);
      const updatedGameData = await this.getGameById(gameId);
      if (!updatedGameData) {
         throw new Error('Failed to fetch updated game data after update.');
      }
      console.log('[GameService] Returning updated game data:', updatedGameData);
      return updatedGameData;

    } catch (error) {
      console.error(`[GameService] Error updating settings for game ${gameId}:`, error);
      throw error; // Rilancia l'errore per il controller
    }
  }

  // Metodo per ottenere i dati combinati
  async getGameById(gameId: string): Promise<any | null> {
    console.log(`[GameService] Fetching combined data for game ID: ${gameId}`);
    try {
      const { data, error } = await supabase
        .from('flt_games')
        .select(`
          *,
          settings:flt_game_settings (*)
        `)
        .eq('id', gameId)
        .maybeSingle();

      if (error) {
        console.error(`[GameService] Error fetching game ${gameId}:`, error);
        throw error;
      }

      if (!data) {
        console.log(`[GameService] Game with ID ${gameId} not found.`);
        return null;
      }

      // Estrai le impostazioni
      const settings = Array.isArray(data.settings) ? data.settings[0] : data.settings;
      console.log(`[GameService] Raw settings for game ${gameId}:`, settings);
      
      // Crea l'oggetto formattato con i dati corretti
      const formattedData = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          isActive: data.is_active,
          // Prendi questi valori da settings invece che da data
          weeklyLeaderboard: settings?.weekly_leaderboard ?? false,
          monthlyLeaderboard: settings?.monthly_leaderboard ?? false,
          gameType: settings?.game_type || 'books',
          feltrinelliGameId: data.feltrinelli_id,
          // Usa i valori dalle impostazioni o valori predefiniti
          timerDuration: settings?.timer_duration ?? 30,
          questionCount: settings?.question_count ?? 10,
          difficulty: settings?.difficulty ?? 1,
          // Includi anche l'oggetto settings per compatibilità
          settings: {
            timerDuration: settings?.timer_duration ?? 30,
            questionCount: settings?.question_count ?? 10,
            difficulty: settings?.difficulty ?? 1,
            weeklyLeaderboard: settings?.weekly_leaderboard ?? false,
            monthlyLeaderboard: settings?.monthly_leaderboard ?? false,
            gameType: settings?.game_type || 'books'
          },
          createdAt: data.created_at,
          updatedAt: data.updated_at || settings?.updated_at
      };

      // Log dei dettagli delle impostazioni per il singolo gioco
      console.log(`[GameService] Game ${formattedData.id} (${formattedData.name}) settings:`, {
        weeklyLeaderboard: formattedData.weeklyLeaderboard,
        monthlyLeaderboard: formattedData.monthlyLeaderboard,
        gameType: formattedData.gameType,
        timerDuration: formattedData.timerDuration,
        questionCount: formattedData.questionCount,
        difficulty: formattedData.difficulty
      });

      console.log(`[GameService] Returning formatted data for game ${gameId}:`, formattedData);
      return formattedData;
    } catch (error) {
      console.error(`[GameService] Error in getGameById for game ${gameId}:`, error);
      throw error;
    }
  }
}

// Esporta un'istanza singleton del servizio
export const gameService = new GameService();
