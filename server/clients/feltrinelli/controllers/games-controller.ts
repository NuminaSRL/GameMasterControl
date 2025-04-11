import { Request, Response } from 'express';
import { gameService } from '../services/game-service';
import { supabase } from '../../../supabase';


/**
 * Controller per la gestione delle richieste relative ai giochi
 */
export class GamesController {
  /**
   * Recupera tutti i giochi disponibili
   */
  async getAllGames(req: Request, res: Response) {
    try {
      const games = await gameService.getAllGames();
      // Assicurati che il formato della risposta sia identico al vecchio endpoint
      res.json(games);
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
      const game = await gameService.getGame(req.params.id);
      res.json(game);
    } catch (error) {
      console.error(`[GamesController] Error fetching game with ID ${req.params.id}:`, error);
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
      const settings = await gameService.getGameSettings(gameId);
      res.json(settings);
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
      const badges = await gameService.getGameBadges(req.params.gameId);
      res.json(badges);
    } catch (error) {
      console.error(`[GamesController] Error fetching badges for game ${req.params.gameId}:`, error);
      res.status(500).json({ 
        message: `Error fetching game badges: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  /**
   * Aggiorna le impostazioni di un gioco specifico
   */
  async updateGameSettings(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const settings = req.body;
      
      console.log(`[GamesController] Updating settings for Feltrinelli game ${id}:`, settings);
      
      // Verifica che i campi necessari siano presenti
      if (!settings.timer_duration && settings.timer_duration !== 0) {
        console.warn(`[GamesController] Missing timer_duration field for game ${id}`);
        return res.status(400).json({ 
          message: 'Missing required settings field: timer_duration'
        });
      }
      
      // Aggiorna le impostazioni nella tabella flt_game_settings
      const { data, error } = await supabase
        .from('flt_game_settings')
        .upsert({
          game_id: id,
          timer_duration: settings.timer_duration,
          question_count: settings.question_count || 10,
          difficulty: settings.difficulty || 1,
          updated_at: new Date()
        })
        .select()
        .single();
      
      if (error) {
        console.error(`[GamesController] Error updating settings in database:`, error);
        throw error;
      }
      
      console.log(`[GamesController] Settings updated successfully:`, data);
      res.json(data);
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