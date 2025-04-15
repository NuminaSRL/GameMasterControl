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
        paramType: typeof gameId
      });
      
      // Ottieni tutti i premi associati al gioco
      const query = `
        SELECT r.*, rg.leaderboard_type as "leaderboardType", rg.position
        FROM flt_rewards r
        JOIN reward_games rg ON r.id = rg.reward_id
        WHERE rg.game_id = $1::uuid
        ${leaderboardType ? 'AND rg.leaderboard_type = $2' : ''}
        ORDER BY rg.position, r.points DESC
      `;
      
      const params = leaderboardType ? [gameId, leaderboardType] : [gameId];
      
      const result = await db.execute(query, params);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[FeltrinelliRouter] Error fetching rewards for game:', error);
      res.status(500).json({ 
        message: `Error fetching rewards for game: ${error instanceof Error ? error.message : 'Unknown error'}` 
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
      
      // Controlla se l'associazione esiste già
      const checkQuery = `
        SELECT * FROM reward_games
        WHERE game_id = $1::uuid AND reward_id = $2::integer AND leaderboard_type = $3
      `;
      
      const checkResult = await db.execute(checkQuery, [gameId, rewardId, leaderboardType]);
      
      if (checkResult.rowCount > 0) {
        // Aggiorna l'associazione esistente
        const updateQuery = `
          UPDATE reward_games
          SET position = $1, updated_at = NOW()
          WHERE game_id = $2::uuid AND reward_id = $3::integer AND leaderboard_type = $4
          RETURNING *
        `;
        
        const updateResult = await db.execute(updateQuery, [position, gameId, rewardId, leaderboardType]);
        
        res.json(updateResult.rows[0]);
      } else {
        // Crea una nuova associazione
        const insertQuery = `
          INSERT INTO reward_games (game_id, reward_id, leaderboard_type, position)
          VALUES ($1::uuid, $2::integer, $3, $4)
          RETURNING *
        `;
        
        const insertResult = await db.execute(insertQuery, [gameId, rewardId, leaderboardType, position]);
        
        res.status(201).json(insertResult.rows[0]);
      }
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
      
      let query = `
        DELETE FROM reward_games
        WHERE game_id = $1::uuid AND reward_id = $2::integer
      `;
      
      const params: any[] = [gameId, rewardId];
      
      if (leaderboardType) {
        query += ' AND leaderboard_type = $3';
        params.push(leaderboardType);
      }
      
      await db.execute(query, params);
      
      res.status(204).send();
    } catch (error) {
      console.error('[FeltrinelliRouter] Error removing reward from game:', error);
      res.status(500).json({ 
        message: `Error removing reward from game: ${error instanceof Error ? error.message : 'Unknown error'}` 
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