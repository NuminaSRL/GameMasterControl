/**
 * API per la gestione dei profili utente con rewards e badge
 */
import { Request, Response } from 'express';
import { supabase } from './supabase';

/**
 * Ottiene il profilo di un utente con i suoi premi e badge
 */
export async function getUserProfile(req: Request, res: Response) {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId è obbligatorio' 
      });
    }
    
    // Recupera profilo utente
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError) {
      console.error('Errore nel recupero del profilo utente:', profileError);
      return res.status(404).json({ 
        success: false, 
        message: 'Profilo utente non trovato',
        error: profileError.message
      });
    }
    
    // Recupera reward dell'utente
    const { data: userRewards, error: rewardsError } = await supabase
      .from('flt_user_rewards')
      .select(`
        id,
        user_id,
        reward_id,
        created_at,
        flt_rewards (
          id,
          name,
          description,
          type,
          value,
          icon,
          color,
          image_url,
          game_id
        )
      `)
      .eq('user_id', userId);
    
    if (rewardsError) {
      console.error('Errore nel recupero dei premi dell\'utente:', rewardsError);
    }
    
    // Recupera badge dell'utente
    const { data: userBadges, error: badgesError } = await supabase
      .from('flt_user_badges')
      .select(`
        id,
        user_id,
        badge_id,
        created_at,
        badges (
          id,
          name,
          description,
          icon,
          color
        )
      `)
      .eq('user_id', userId);
    
    if (badgesError) {
      console.error('Errore nel recupero dei badge dell\'utente:', badgesError);
    }
    
    // Recupera statistiche dell'utente
    const { data: userStats, error: statsError } = await supabase
      .from('flt_user_stats')
      .select(`
        id,
        user_id,
        game_id,
        games_played,
        correct_answers,
        wrong_answers,
        total_points,
        best_score,
        avg_time_per_question,
        last_played_at
      `)
      .eq('user_id', userId);
    
    if (statsError) {
      console.error('Errore nel recupero delle statistiche dell\'utente:', statsError);
    }
    
    // Prepara la risposta
    const response = {
      success: true,
      profile,
      rewards: userRewards || [],
      badges: userBadges || [],
      stats: userStats || []
    };
    
    res.json(response);
  } catch (error) {
    console.error('Errore nel recupero del profilo utente completo:', error);
    res.status(500).json({ 
      success: false, 
      message: `Errore del server: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` 
    });
  }
}

/**
 * Ottiene i badge di un utente per un gioco specifico
 */
export async function getUserGameBadges(req: Request, res: Response) {
  try {
    const { userId, gameId } = req.params;
    
    if (!userId || !gameId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId e gameId sono obbligatori' 
      });
    }
    
    // Recupero dei dati con query LEFT JOIN
    // Prima ottieni tutti i badge associati al gioco
    const { data: gameBadges, error: gameBadgesError } = await supabase
      .from('flt_game_badges')
      .select(`
        badge_id,
        badges (id, name, description, icon, color)
      `)
      .eq('game_id', gameId);
    
    if (gameBadgesError) {
      console.error('Errore nel recupero dei badge del gioco:', gameBadgesError);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero dei badge del gioco', 
        error: gameBadgesError.message 
      });
    }
    
    // Poi ottieni i badge che l'utente ha già sbloccato
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('flt_user_badges')
      .select('badge_id, created_at')
      .eq('user_id', userId);
    
    if (userBadgesError) {
      console.error('Errore nel recupero dei badge dell\'utente:', userBadgesError);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero dei badge dell\'utente', 
        error: userBadgesError.message 
      });
    }
    
    // Crea un set di ID badge che l'utente ha già
    const userBadgeIds = new Set(userBadges?.map(b => b.badge_id) || []);
    
    // Combina i dati
    const combinedBadges = gameBadges?.map(gb => {
      const badgeInfo = gb.badges;
      const isUnlocked = userBadgeIds.has(gb.badge_id);
      
      return {
        id: badgeInfo.id,
        name: badgeInfo.name,
        description: badgeInfo.description,
        icon: badgeInfo.icon,
        color: badgeInfo.color,
        is_unlocked: isUnlocked,
        unlocked_at: isUnlocked ? 
          userBadges?.find(ub => ub.badge_id === gb.badge_id)?.created_at : 
          null
      };
    });
    
    res.json({
      success: true,
      game_id: gameId,
      user_id: userId,
      badges: combinedBadges || []
    });
  } catch (error) {
    console.error('Errore nel recupero dei badge dell\'utente per il gioco:', error);
    res.status(500).json({ 
      success: false, 
      message: `Errore del server: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` 
    });
  }
}

/**
 * Ottiene i premi di un utente per un gioco specifico
 */
export async function getUserGameRewards(req: Request, res: Response) {
  try {
    const { userId, gameId } = req.params;
    
    if (!userId || !gameId) {
      return res.status(400).json({ 
        success: false, 
        message: 'userId e gameId sono obbligatori' 
      });
    }
    
    // Recupera tutti i premi disponibili per il gioco
    const { data: gameRewards, error: gameRewardsError } = await supabase
      .from('flt_rewards')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_active', true);
    
    if (gameRewardsError) {
      console.error('Errore nel recupero dei premi del gioco:', gameRewardsError);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero dei premi del gioco', 
        error: gameRewardsError.message 
      });
    }
    
    // Recupera i premi già ottenuti dall'utente
    const { data: userRewards, error: userRewardsError } = await supabase
      .from('flt_user_rewards')
      .select('reward_id, created_at')
      .eq('user_id', userId);
    
    if (userRewardsError) {
      console.error('Errore nel recupero dei premi dell\'utente:', userRewardsError);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero dei premi dell\'utente', 
        error: userRewardsError.message 
      });
    }
    
    // Crea un set di ID premi che l'utente ha già
    const userRewardIds = new Set(userRewards?.map(r => r.reward_id) || []);
    
    // Combina i dati
    const combinedRewards = gameRewards?.map(reward => {
      const isUnlocked = userRewardIds.has(reward.id);
      
      return {
        ...reward,
        is_unlocked: isUnlocked,
        unlocked_at: isUnlocked ? 
          userRewards?.find(ur => ur.reward_id === reward.id)?.created_at : 
          null
      };
    });
    
    res.json({
      success: true,
      game_id: gameId,
      user_id: userId,
      rewards: combinedRewards || []
    });
  } catch (error) {
    console.error('Errore nel recupero dei premi dell\'utente per il gioco:', error);
    res.status(500).json({ 
      success: false, 
      message: `Errore del server: ${error instanceof Error ? error.message : 'Errore sconosciuto'}` 
    });
  }
}
