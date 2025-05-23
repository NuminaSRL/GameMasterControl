import { Request, Response } from 'express';
import { gameService } from '../services/game-service';
import { supabase } from '../../../supabase';
import { db } from '../../../db';


/**
 * Controller per la gestione delle richieste relative ai giochi
 */
export class GamesController {
  /**
   * Recupera tutti i giochi disponibili
   */
  async getAllGames(req: Request, res: Response) {
    try {
      console.log('[GamesController] Fetching all games');
      
      // Recupera tutti i giochi da flt_games
      const { data: gamesData, error: gamesError } = await supabase
        .from('flt_games')
        .select(`
          *,
          settings:flt_game_settings (
            timer_duration,
            question_count,
            difficulty,
            weekly_leaderboard,
            monthly_leaderboard,
            game_type,
            updated_at
          )
        `)
        .order('name');
      
      if (gamesError) {
        console.error('[GamesController] Error fetching games:', gamesError);
        throw gamesError;
      }
      
      // Combina i dati dei giochi con le loro impostazioni
      const formattedGames = gamesData.map(game => {
        const settings = Array.isArray(game.settings) ? game.settings[0] : game.settings;
        console.log(`[GamesController] Processing game ${game.id} (${game.name}), settings:`, settings);
        
        // Log the date fields to debug
        console.log(`[GamesController] Game ${game.id} date fields:`, {
          start_date: game.start_date,
          end_date: game.end_date
        });
        
        return {
          id: game.id,
          name: game.name,
          description: game.description || '',
          isActive: game.is_active,
          imageUrl: game.image_url || '',
          // Prendi questi valori da settings invece che da game
          weeklyLeaderboard: settings?.weekly_leaderboard ?? false,
          monthlyLeaderboard: settings?.monthly_leaderboard ?? false,
          gameType: settings?.game_type || 'books',
          feltrinelliGameId: game.feltrinelli_id,
          // Valori dalle impostazioni
          timerDuration: settings?.timer_duration ?? 30,
          questionCount: settings?.question_count ?? 10,
          difficulty: settings?.difficulty ?? 1,
          // Aggiungi le date di inizio e fine dalla tabella flt_games
          startDate: game.start_date || null,
          endDate: game.end_date || null,
          // Campi aggiuntivi per compatibilità
          settings: {
            timerDuration: settings?.timer_duration ?? 30,
            questionCount: settings?.question_count ?? 10,
            difficulty: settings?.difficulty ?? 1,
            weeklyLeaderboard: settings?.weekly_leaderboard ?? false,
            monthlyLeaderboard: settings?.monthly_leaderboard ?? false,
            gameType: settings?.game_type || 'books',
            // Include date fields in settings object too
            startDate: game.start_date || null,
            endDate: game.end_date || null
          },
          createdAt: game.created_at,
          updatedAt: game.updated_at || settings?.updated_at
        };
      });
      
      console.log(`[GamesController] Retrieved ${formattedGames.length} games`);
      // Log the first game with all its fields to debug
      console.log('[GamesController] First game data (complete):', JSON.stringify(formattedGames[0], null, 2));
      res.json(formattedGames);
    } catch (error) {
      console.error('[GamesController] Error fetching all games:', error);
      res.status(500).json({ 
        message: `Error fetching games: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

/**
 * Recupera un gioco specifico con le sue impostazioni
 */
async getGame(req: Request, res: Response) {
    try {
      const gameId = req.params.id;
      
      console.log('[GamesController] Recupero gioco:', gameId);
      
      // Recupera il gioco con le impostazioni in un'unica query
      const { data: game, error: gameError } = await supabase
        .from('flt_games')
        .select(`
          *,
          settings:flt_game_settings (
            timer_duration,
            question_count,
            difficulty,
            weekly_leaderboard,
            monthly_leaderboard,
            game_type,
            updated_at
          )
        `)
        .eq('id', gameId)
        .single();
      
      if (gameError) {
        console.error('[GamesController] Errore recupero gioco:', gameError);
        throw gameError;
      }
      
      // Log the date fields to debug
      console.log(`[GamesController] Game ${gameId} date fields:`, {
        start_date: game.start_date,
        end_date: game.end_date
      });
      
      // Estrai le impostazioni
      const settings = Array.isArray(game.settings) ? game.settings[0] : game.settings;
      
      // Combina il gioco con le sue impostazioni
      const gameWithSettings = {
        id: game.id,
        name: game.name,
        description: game.description || '',
        isActive: game.is_active,
        imageUrl: game.image_url || '',
        // Prendi questi valori da settings invece che da game
        weeklyLeaderboard: settings?.weekly_leaderboard ?? false,
        monthlyLeaderboard: settings?.monthly_leaderboard ?? false,
        gameType: settings?.game_type || 'books',
        feltrinelliGameId: game.feltrinelli_id,
        // Valori dalle impostazioni
        timerDuration: settings?.timer_duration ?? 30,
        questionCount: settings?.question_count ?? 10,
        difficulty: settings?.difficulty ?? 1,
        // Aggiungi le date di inizio e fine dalla tabella flt_games
        startDate: game.start_date || null,
        endDate: game.end_date || null,
        // Campi aggiuntivi per compatibilità
        settings: {
          timerDuration: settings?.timer_duration ?? 30,
          questionCount: settings?.question_count ?? 10,
          difficulty: settings?.difficulty ?? 1,
          weeklyLeaderboard: settings?.weekly_leaderboard ?? false,
          monthlyLeaderboard: settings?.monthly_leaderboard ?? false,
          gameType: settings?.game_type || 'books',
          // Include date fields in settings object too
          startDate: game.start_date || null,
          endDate: game.end_date || null
        },
        createdAt: game.created_at,
        updatedAt: game.updated_at || settings?.updated_at
      };
      
      console.log('[GamesController] Gioco recuperato con impostazioni (complete):', JSON.stringify(gameWithSettings, null, 2));
      res.json(gameWithSettings);
    } catch (error) {
      console.error('[GamesController] Error fetching game:', error);
      res.status(500).json({ 
        message: `Error fetching game: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  /**
   * Recupera le impostazioni di un gioco
   */
  async getGameSettings(req: Request, res: Response) {
    try {
      // Supporta sia il formato /:gameId/settings che /game-settings/:gameId
      const gameId = req.params.gameId;
      
      console.log(`[GamesController] Fetching settings for game ${gameId}`);
      
      // Recupera le informazioni del gioco da flt_games
      const { data: gameData, error: gameError } = await supabase
        .from('flt_games')
        .select('*')
        .eq('id', gameId)
        .single();
      
      if (gameError) {
        console.error(`[GamesController] Error fetching game data:`, gameError);
        throw gameError;
      }
      
      // Log the date fields to debug
      console.log(`[GamesController] Game ${gameId} date fields:`, {
        start_date: gameData.start_date,
        end_date: gameData.end_date
      });
      
      // Recupera le impostazioni del gioco da flt_game_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('flt_game_settings')
        .select('*')
        .eq('game_id', gameId)
        .maybeSingle();
      
      if (settingsError) {
        console.error(`[GamesController] Error fetching game settings:`, settingsError);
        // Non interrompiamo l'esecuzione, continuiamo con i dati del gioco
      }
      
      // Combina i dati del gioco con le impostazioni in un formato compatibile con il frontend
      const combinedSettings = {
        id: gameId,
        name: gameData.name,
        description: gameData.description || '',
        isActive: gameData.is_active,
        // Prendi questi valori da settingsData invece che da gameData
        weeklyLeaderboard: settingsData?.weekly_leaderboard ?? false,
        monthlyLeaderboard: settingsData?.monthly_leaderboard ?? false,
        gameType: settingsData?.game_type || 'books',
        feltrinelliGameId: gameData.feltrinelli_id,
        // Valori dalle impostazioni
        timerDuration: settingsData?.timer_duration ?? 30,
        questionCount: settingsData?.question_count ?? 10,
        difficulty: settingsData?.difficulty ?? 1,
        // Aggiungi le date di inizio e fine dalla tabella flt_games
        startDate: gameData.start_date || null,
        endDate: gameData.end_date || null,
        // Campi aggiuntivi per compatibilità
        settings: {
          timerDuration: settingsData?.timer_duration ?? 30,
          questionCount: settingsData?.question_count ?? 10,
          difficulty: settingsData?.difficulty ?? 1,
          weeklyLeaderboard: settingsData?.weekly_leaderboard ?? false,
          monthlyLeaderboard: settingsData?.monthly_leaderboard ?? false,
          gameType: settingsData?.game_type || 'books',
          // Include date fields in settings object too
          startDate: gameData.start_date || null,
          endDate: gameData.end_date || null
        },
        createdAt: gameData.created_at,
        updatedAt: gameData.updated_at || settingsData?.updated_at
      };
      
      console.log(`[GamesController] Game settings retrieved (complete):`, JSON.stringify(combinedSettings, null, 2));
      res.json(combinedSettings);
    } catch (error) {
      console.error(`[GamesController] Error fetching settings for game ${req.params.gameId}:`, error);
      res.status(500).json({ 
        message: `Error fetching game settings: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  /**
   * Recupera tutti i badge di un gioco
   */
  async getGameBadges(req: Request, res: Response) {
    try {
      const gameId = req.params.gameId;
      
      console.log('[GamesController] Recupero badge per il gioco:', gameId);
      
      // Recupera i badge associati al gioco
      const { data: badges, error } = await supabase
        .from('flt_badges')
        .select('*')
        .eq('game_id', gameId)
        .order('points', { ascending: false });
      
      if (error) {
        console.error('[GamesController] Errore recupero badge:', error);
        throw error;
      }
      
      console.log('[GamesController] Badge recuperati:', badges);
      res.json(badges);
    } catch (error) {
      console.error(`[GamesController] Error fetching badges for game ${req.params.gameId}:`, error);
      res.status(500).json({ 
        message: `Error fetching game badges: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  // Aggiungi/modifica questi metodi nella classe GamesController
  
  /**
   * Ottiene i premi associati a un gioco specifico
   */
  async getGameRewards(req: Request, res: Response) {
    try {
      const gameId = req.params.gameId;
      const leaderboardType = req.query.leaderboardType as string | undefined;
      
      console.log('[FeltrinelliRouter] Fetching rewards for game:', {
        gameId,
        leaderboardType,
        paramType: typeof gameId
      });
      
      // Utilizziamo l'API di Supabase invece di SQL raw
      // Primo passo: otteniamo tutti i record di reward_games per questo gioco
      let rewardGamesQuery = supabase
        .from('reward_games')
        .select('*')
        .eq('game_id', gameId);
      
      if (leaderboardType) {
        rewardGamesQuery = rewardGamesQuery.eq('leaderboard_type', leaderboardType);
      }
      
      rewardGamesQuery = rewardGamesQuery.order('position', { ascending: true });
      
      const { data: rewardGamesData, error: rewardGamesError } = await rewardGamesQuery;
      
      if (rewardGamesError) {
        console.error('[FeltrinelliRouter] Errore query reward_games:', rewardGamesError);
        throw rewardGamesError;
      }
      
      if (!rewardGamesData || rewardGamesData.length === 0) {
        console.log('[FeltrinelliRouter] Nessun premio associato al gioco');
        return res.json([]);
      }
      
      // Secondo passo: otteniamo i dettagli di tutti i premi
      const rewardIds = rewardGamesData.map(rg => rg.reward_id);
      
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('flt_rewards')
        .select('*')
        .in('id', rewardIds);
      
      if (rewardsError) {
        console.error('[FeltrinelliRouter] Errore query flt_rewards:', rewardsError);
        throw rewardsError;
      }
      
      // Combiniamo i dati
      const formattedRewards = rewardGamesData.map(rg => {
        const reward = rewardsData.find(r => r.id === rg.reward_id);
        if (!reward) return null;
        
        return {
          id: reward.id,
          name: reward.name,
          description: reward.description,
          points: reward.points,
          isActive: reward.is_active,
          imageUrl: reward.image_url,
          type: reward.type,
          value: reward.value,
          icon: reward.icon,
          color: reward.color,
          position: rg.position,
          leaderboardType: rg.leaderboard_type
        };
      }).filter(Boolean); // Rimuove eventuali null
      
      res.json(formattedRewards);
    } catch (error) {
      console.error('[FeltrinelliRouter] Error fetching rewards for game:', error);
      res.status(500).json({ 
        error: 'Error fetching rewards for game',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Associa un premio a un gioco
   */
  async associateRewardToGame(req: Request, res: Response) {
    try {
      const { gameId, rewardId } = req.params;
      const { leaderboardType, position = 1 } = req.body;
      
      console.log('[FeltrinelliRouter] Associating reward with game:', {
        gameId,
        rewardId,
        leaderboardType,
        position
      });
      
      // Validazione
      if (!['weekly', 'monthly', 'global'].includes(leaderboardType)) {
        return res.status(400).json({ 
          message: 'Invalid leaderboard type. Must be weekly, monthly, or global.' 
        });
      }
      
      // Verifica se l'associazione esiste già
      const { data: existingData, error: checkError } = await supabase
        .from('reward_games')
        .select('*')
        .eq('game_id', gameId)
        .eq('reward_id', rewardId)
        .eq('leaderboard_type', leaderboardType)
        .maybeSingle();
      
      if (checkError) {
        console.error('[FeltrinelliRouter] Errore verifica associazione esistente:', checkError);
        throw checkError;
      }
      
      let result;
      
      if (existingData) {
        // Aggiorna l'associazione esistente
        const { data: updateData, error: updateError } = await supabase
          .from('reward_games')
          .update({ 
            position: position,
            updated_at: new Date().toISOString()
          })
          .eq('game_id', gameId)
          .eq('reward_id', rewardId)
          .eq('leaderboard_type', leaderboardType)
          .select()
          .single();
        
        if (updateError) {
          console.error('[FeltrinelliRouter] Errore aggiornamento associazione:', updateError);
          throw updateError;
        }
        
        result = updateData;
      } else {
        // Crea una nuova associazione
        const now = new Date().toISOString();
        
        const { data: insertData, error: insertError } = await supabase
          .from('reward_games')
          .insert({
            game_id: gameId,
            reward_id: rewardId,
            leaderboard_type: leaderboardType,
            position: position,
            created_at: now,
            updated_at: now
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('[FeltrinelliRouter] Errore creazione associazione:', insertError);
          throw insertError;
        }
        
        result = insertData;
      }
      
      res.status(existingData ? 200 : 201).json(result);
    } catch (error) {
      console.error('[FeltrinelliRouter] Error associating reward with game:', error);
      res.status(500).json({ 
        message: `Error associating reward with game: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  /**
   * Rimuove un premio da un gioco
   */
  async removeRewardFromGame(req: Request, res: Response) {
    try {
      const { gameId, rewardId } = req.params;
      const leaderboardType = req.query.leaderboardType as string;
      
      console.log('[FeltrinelliRouter] Removing reward from game:', {
        gameId,
        rewardId,
        leaderboardType
      });
      
      let query = supabase
        .from('reward_games')
        .delete();
      
      query = query.eq('game_id', gameId);
      query = query.eq('reward_id', rewardId);
      
      if (leaderboardType) {
        query = query.eq('leaderboard_type', leaderboardType);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('[FeltrinelliRouter] Errore rimozione associazione:', error);
        throw error;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('[FeltrinelliRouter] Error removing reward from game:', error);
      res.status(500).json({ 
        message: `Error removing reward from game: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  /**
   * Aggiorna le impostazioni di un gioco
   */
  async updateGameSettings(req: Request, res: Response) {
    try {
      const gameId = req.params.id || req.params.gameId;
      const settings = req.body;
      
      console.log('[GamesController] Aggiornamento impostazioni gioco - Dati ricevuti:', {
        gameId,
        settings
      });
      
      // Verifica che i valori numerici siano effettivamente numeri
      if (settings.timer_duration) {
        settings.timer_duration = Number(settings.timer_duration);
      }
      if (settings.question_count) {
        settings.question_count = Number(settings.question_count);
      }
      if (settings.difficulty) {
        settings.difficulty = Number(settings.difficulty);
      }
      
      // Estrai i campi che vanno nella tabella flt_games
      const gameFields = {
        name: settings.name,
        description: settings.description,
        is_active: settings.is_active,
        feltrinelli_id: settings.feltrinelli_id,
        start_date: settings.start_date,
        end_date: settings.end_date
      };
      
      // Aggiorna i campi nella tabella flt_games
      if (Object.keys(gameFields).some(key => gameFields[key as keyof typeof gameFields] !== undefined)) {
        console.log('[GamesController] Aggiornamento campi nella tabella flt_games:', gameFields);
        
        const { error: gameUpdateError } = await supabase
          .from('flt_games')
          .update(gameFields)
          .eq('id', gameId);
        
        if (gameUpdateError) {
          console.error('[GamesController] Errore aggiornamento flt_games:', gameUpdateError);
          throw gameUpdateError;
        }
      }
      
      // Utilizziamo il servizio per aggiornare le impostazioni
      const updatedSettings = await gameService.updateGameSettings(gameId, settings);
      
      console.log('[GamesController] Impostazioni aggiornate con successo - Risposta:', updatedSettings);
      
      // Verifica che i valori restituiti corrispondano a quelli inviati
      if (settings.timer_duration && updatedSettings.timerDuration !== settings.timer_duration) {
        console.warn('[GamesController] Attenzione: timerDuration restituito diverso da quello inviato', {
          inviato: settings.timer_duration,
          restituito: updatedSettings.timerDuration
        });
      }
      
      // Aggiungi le date alla risposta
      if (settings.start_date) {
        updatedSettings.startDate = settings.start_date;
      }
      if (settings.end_date) {
        updatedSettings.endDate = settings.end_date;
      }
      
      res.json(updatedSettings);
    } catch (error) {
      console.error('[GamesController] Error updating game settings:', error);
      res.status(500).json({ 
        message: `Error updating game settings: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
}



// Esporta un'istanza singleton del controller
export const gamesController = new GamesController();