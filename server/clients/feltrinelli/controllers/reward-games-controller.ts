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
      }).filter((item): item is NonNullable<typeof item> => item !== null); // Type guard to ensure non-null values
      
      // Rimuovi duplicati basati sull'ID del premio
      const uniqueRewards = Array.from(
        new Map(formattedRewards.map(item => [item.id, item])).values()
      );
      
      // In the getGameRewards method, after preparing the uniqueRewards
      console.log('[RewardGamesController] Risposta formattata (dopo rimozione duplicati):', uniqueRewards);
      
      // Add cache control headers to prevent stale data
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(uniqueRewards);
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

  /**
   * Recupera tutti i premi associati a un gioco per il client
   */
  async getClientGameRewards(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const leaderboardType = req.query.leaderboardType as string || 'global'; // Default a global
      
      console.log(`[RewardGamesController] Recupero premi per client, gameId: ${gameId}, leaderboardType: ${leaderboardType}`);
      
      // Verifica che il gioco esista e sia attivo
      const { data: gameData, error: gameError } = await supabase
        .from('flt_games')
        .select('id, name')
        .eq('id', gameId)
        .eq('is_active', true)
        .single();
      
      if (gameError || !gameData) {
        console.error('[RewardGamesController] Gioco non trovato o non attivo:', gameError);
        return res.status(404).json({ error: 'Game not found or not active' });
      }
      
      // Recupera SOLO i premi ESPLICITAMENTE configurati per questo gioco e tipo di classifica
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('reward_games')
        .select(`
          position,
          flt_rewards!inner(
            id, name, description, image_url, points, type, value, icon, color, is_active
          )
        `)
        .eq('game_id', gameId)
        .eq('leaderboard_type', leaderboardType)
        .order('position', { ascending: true });
      
      if (rewardsError) {
        console.error('[RewardGamesController] Errore recupero premi:', rewardsError);
        throw rewardsError;
      }
      
      console.log(`[RewardGamesController] Trovati ${rewardsData?.length || 0} premi per il gioco ${gameData.name}`);
      
      // Se non ci sono premi, restituisci un array vuoto
      if (!rewardsData || rewardsData.length === 0) {
        return res.json({
          data: [],
          game: {
            id: gameData.id,
            name: gameData.name
          },
          leaderboardType
        });
      }
      
      // Formatta la risposta
      const formattedRewards = rewardsData.map((item: any) => {
        const reward = item.flt_rewards;
        
        // Costruisci URL completo per le immagini se è presente un image_url
        let imageUrl = reward.image_url;
        if (imageUrl && !imageUrl.startsWith('http')) {
          // Se l'immagine è su Supabase Storage, costruisci l'URL pubblico
          const publicUrl = `https://hdguwqhxbqssdtqgilmy.supabase.co/storage/v1/object/public/uploads/${imageUrl}`;
          imageUrl = publicUrl;
        }
        
        return {
          id: reward.id,
          name: reward.name,
          description: reward.description,
          image_url: imageUrl,
          points: reward.points,
          type: reward.type,
          value: reward.value,
          position: item.position,
          icon: reward.icon,
          color: reward.color
        };
      });
      
      res.json({
        data: formattedRewards,
        game: {
          id: gameData.id,
          name: gameData.name
        },
        leaderboardType
      });
    } catch (error) {
      console.error('[RewardGamesController] Errore durante il recupero dei premi:', error);
      res.status(500).json({
        error: 'Errore durante il recupero dei premi',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  }
}