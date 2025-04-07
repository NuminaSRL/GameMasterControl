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
    // Creiamo un profilo mock temporaneo dato che non abbiamo la tabella
    const profile = {
      id: userId,
      user_id: userId,
      username: 'Utente Test',
      email: 'test@example.com',
      avatar_url: 'https://www.gravatar.com/avatar/test',
      created_at: new Date().toISOString()
    };
    
    // Simuliamo l'errore se userId è vuoto
    const profileError = !userId ? { message: 'Utente non trovato' } : null;
    
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
        rewards:reward_id (
          id,
          name,
          description,
          type,
          value,
          icon,
          color,
          image_url,
          game_type
        )
      `)
      .eq('user_id', userId);
    
    if (rewardsError) {
      console.error('Errore nel recupero dei premi dell\'utente:', rewardsError);
    }
    
    // Recupera badge dell'utente
    const { data: userBadges, error: badgesError } = await supabase
      .from('user_badges')
      .select(`
        id,
        user_id,
        badge_id,
        created_at,
        badges:badge_id (
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
      .from('user_stats')
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
    
    // Creiamo badge mock per questo gioco
    const mockBadges = [
      {
        badge_id: 1,
        badges: {
          id: 1,
          name: 'Quiz Master',
          description: 'Rispondi correttamente a 10 domande',
          icon: 'trophy',
          color: '#FFC107'
        }
      },
      {
        badge_id: 2,
        badges: {
          id: 2,
          name: 'Lettore Esperto',
          description: 'Riconosci 5 libri diversi',
          icon: 'book',
          color: '#4CAF50'
        }
      }
    ];
    
    // Simuliamo i badge del gioco
    const gameBadges = mockBadges;
    const gameBadgesError = null;
    
    if (gameBadgesError) {
      console.error('Errore nel recupero dei badge del gioco:', gameBadgesError);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero dei badge del gioco', 
        error: gameBadgesError.message 
      });
    }
    
    // Creiamo user badges mock
    const userBadges = [{ badge_id: 1, created_at: new Date().toISOString() }];
    const userBadgesError = null;
    
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
    
    // Creiamo premi mock per questo gioco
    const mockRewards = [
      {
        id: 1,
        name: 'Buono sconto',
        description: 'Uno sconto del 10% sul catalogo musica',
        type: 'discount',
        value: '10%',
        icon: 'ticket',
        color: '#E91E63',
        available: 50,
        image_url: 'https://www.lafeltrinelli.it/images/rewards/buonosconto.png',
        game_type: gameId === '1' ? 'books' : gameId === '2' ? 'authors' : 'years'
      },
      {
        id: 2,
        name: 'Tazza Feltrinelli',
        description: 'La nostra tazza pensata per i lettori',
        type: 'physical',
        value: 'tazza',
        icon: 'coffee',
        color: '#795548',
        available: 25,
        image_url: 'https://www.lafeltrinelli.it/images/rewards/tazza.png',
        game_type: gameId === '1' ? 'books' : gameId === '2' ? 'authors' : 'years'
      }
    ];
    
    // Simuliamo i premi del gioco
    const gameRewards = mockRewards;
    const gameRewardsError = null;
    
    if (gameRewardsError) {
      console.error('Errore nel recupero dei premi del gioco:', gameRewardsError);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore nel recupero dei premi del gioco', 
        error: gameRewardsError.message 
      });
    }
    
    // Creiamo user rewards mock
    const userRewards = [{ reward_id: 1, created_at: new Date().toISOString() }];
    const userRewardsError = null;
    
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
