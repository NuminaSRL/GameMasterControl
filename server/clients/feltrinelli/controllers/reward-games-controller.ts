import type { Request, Response } from 'express';
import { supabase } from '../../../supabase';
import { db } from '../../../db';

/**
 * Controller per la gestione delle associazioni tra premi e giochi
 */
export class RewardGamesController {
  constructor() {
    console.log('[RewardGamesController] Inizializzato');
  }

  /**
   * Recupera tutti i premi associati a un gioco
   */
  async getGameRewards(req: Request, res: Response) {
    console.log('[RewardGamesController] getGameRewards CHIAMATO con URL:', req.originalUrl, 'e parametri:', {
      params: req.params,
      query: req.query,
      body: req.body
    });
    
    try {
      const gameId = req.params.gameId;
      const leaderboardType = req.query.leaderboardType as string | undefined;
      
      console.log('[RewardGamesController] Recupero premi per il gioco:', {
        gameId,
        leaderboardType,
        paramType: typeof gameId
      });
      
      // Ensure gameId is a valid UUID
      if (!gameId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gameId)) {
        return res.status(400).json({ message: 'Invalid game ID format' });
      }
      
      // Verifica diretta se ci sono associazioni nella tabella reward_games
      const { data: rewardGamesCheck, error: checkError } = await supabase
        .from('reward_games')
        .select('*')
        .eq('game_id', gameId);
      
      console.log('[RewardGamesController] Verifica diretta reward_games:', {
        gameId,
        recordsFound: rewardGamesCheck?.length || 0,
        data: rewardGamesCheck
      });
      
      if (checkError) {
        console.error('[RewardGamesController] Errore verifica reward_games:', checkError);
      }
      
      // Recupera le associazioni premio-gioco
      let rewardGamesQuery = supabase
        .from('reward_games')
        .select(`
          id, position, leaderboard_type, reward_id, game_id
        `)
        .eq('game_id', gameId);
      
      if (leaderboardType) {
        rewardGamesQuery = rewardGamesQuery.eq('leaderboard_type', leaderboardType);
      }
      
      const { data: rewardGamesData, error: rewardGamesError } = await rewardGamesQuery;
      
      if (rewardGamesError) {
        console.error('[RewardGamesController] Errore query reward_games:', rewardGamesError);
        throw rewardGamesError;
      }
      
      console.log('[RewardGamesController] Associazioni premio-gioco trovate:', rewardGamesData);
      
      if (!rewardGamesData || rewardGamesData.length === 0) {
        console.log('[RewardGamesController] Nessun premio associato al gioco');
        return res.json([]);
      }
      
      // Recupera i dettagli dei premi
      const rewardIds = rewardGamesData.map(rg => rg.reward_id);
      
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('flt_rewards')
        .select('*')
        .in('id', rewardIds);
      
      if (rewardsError) {
        console.error('[RewardGamesController] Errore query flt_rewards:', rewardsError);
        throw rewardsError;
      }
      
      console.log('[RewardGamesController] Dettagli premi trovati:', rewardsData);
      
      // Combina i dati
      const formattedRewards = rewardGamesData.map(rg => {
        const reward = rewardsData.find(r => r.id === rg.reward_id);
        if (!reward) {
          console.log('[RewardGamesController] Premio non trovato:', rg.reward_id);
          return null;
        }
        
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
      
      console.log('[RewardGamesController] Risposta formattata:', formattedRewards);
      res.json(formattedRewards);
    } catch (error) {
      console.error('[RewardGamesController] Errore nel recupero dei premi per il gioco:', error);
      res.status(500).json({ 
        message: `Errore nel recupero dei premi per il gioco: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` 
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
      
      console.log('[RewardGamesController] Associazione premio al gioco:', {
        gameId,
        rewardId,
        leaderboardType,
        position
      });
      
      // Validazione
      if (!gameId || !rewardId) {
        return res.status(400).json({ 
          message: 'gameId e rewardId sono obbligatori' 
        });
      }
      
      // Ensure IDs are valid UUIDs
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gameId) || 
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rewardId)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      if (!['weekly', 'monthly', 'global'].includes(leaderboardType)) {
        return res.status(400).json({ 
          message: 'leaderboardType deve essere weekly, monthly o global' 
        });
      }
      
      // Approccio diretto: upsert
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('reward_games')
        .upsert({
          game_id: gameId,
          reward_id: rewardId,
          leaderboard_type: leaderboardType,
          position: position,
          created_at: now,
          updated_at: now
        }, {
          onConflict: 'game_id,reward_id,leaderboard_type',
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('[RewardGamesController] Errore upsert associazione:', error);
        throw error;
      }
      
      res.status(201).json(data);
    } catch (error) {
      console.error('[RewardGamesController] Errore nell\'associazione premio-gioco:', error);
      res.status(500).json({ 
        message: `Errore nell'associazione premio-gioco: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` 
      });
    }
  }

  /**
   * Rimuove l'associazione tra un premio e un gioco
   */
  async removeRewardFromGame(req: Request, res: Response) {
    try {
      const { gameId, rewardId } = req.params;
      const leaderboardType = req.query.leaderboardType as string;
      
      console.log('[RewardGamesController] Rimozione premio dal gioco:', {
        gameId,
        rewardId,
        leaderboardType
      });
      
      let query = supabase
        .from('reward_games')
        .delete()
        .eq('game_id', gameId)
        .eq('reward_id', rewardId);
      
      if (leaderboardType) {
        query = query.eq('leaderboard_type', leaderboardType);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('[RewardGamesController] Errore rimozione associazione:', error);
        throw error;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('[RewardGamesController] Errore nella rimozione dell\'associazione premio-gioco:', error);
      res.status(500).json({ 
        message: `Errore nella rimozione dell'associazione premio-gioco: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` 
      });
    }
  }

  /**
   * Rimuove tutte le associazioni premi per un gioco
   */
  async removeAllRewardsFromGame(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const leaderboardType = req.query.leaderboardType as string;
      
      console.log('[RewardGamesController] Rimozione di tutti i premi dal gioco:', {
        gameId,
        leaderboardType
      });
      
      let query = supabase
        .from('reward_games')
        .delete()
        .eq('game_id', gameId);
      
      if (leaderboardType) {
        query = query.eq('leaderboard_type', leaderboardType);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('[RewardGamesController] Errore rimozione associazioni:', error);
        throw error;
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('[RewardGamesController] Errore nella rimozione di tutte le associazioni premio-gioco:', error);
      res.status(500).json({ 
        message: `Errore nella rimozione di tutte le associazioni premio-gioco: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` 
      });
    }
  }

  /**
   * Recupera tutti i giochi associati a un premio
   */
  async getRewardGames(req: Request, res: Response) {
    try {
      const { rewardId } = req.params;
      
      console.log('[RewardGamesController] Recupero giochi per il premio:', {
        rewardId
      });
      
      // Define interface for the data returned from Supabase
      interface GameRewardItem {
        position: number;
        leaderboard_type: string;
        flt_games: {
          id: string;
          name: string;
          description?: string;
          image_url?: string;
          is_active: boolean;
        };
      }
      
      const { data, error } = await supabase
        .from('reward_games')
        .select(`
          position,
          leaderboard_type,
          flt_games!inner(id, name, description, image_url, is_active)
        `)
        .eq('reward_id', rewardId)
        .order('position', { ascending: true });
      
      if (error) {
        console.error('[RewardGamesController] Errore query Supabase:', error);
        throw error;
      }
      
      // Trasforma i dati nel formato atteso dal client
      // Use type assertion to help TypeScript understand the structure
      const formattedGames = (data as unknown as GameRewardItem[]).map(item => ({
        id: item.flt_games.id,
        name: item.flt_games.name,
        description: item.flt_games.description,
        imageUrl: item.flt_games.image_url,
        isActive: item.flt_games.is_active,
        position: item.position,
        leaderboardType: item.leaderboard_type
      }));
      
      res.json(formattedGames);
    } catch (error) {
      console.error('[RewardGamesController] Errore nel recupero dei giochi per il premio:', error);
      res.status(500).json({ 
        message: `Errore nel recupero dei giochi per il premio: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` 
      });
    }
  }
}