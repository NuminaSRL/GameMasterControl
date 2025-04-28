import express from 'express';
import { db } from '../db';

// Aggiungiamo interfacce per i tipi di dati
interface LeaderboardRow {
  id: string;
  user_id: string;
  game_id?: string;
  points: number;
  username: string;
  avatar_url: string | null;
  game_name?: string;
}

interface LeaderboardEntry {
  id: string;
  user_id: string;
  game_id?: string;
  points: number;
  users: {
    username: string;
    avatar_url: string | null;
  };
}

interface LeaderboardEntryWithRewards extends LeaderboardEntry {
  game_name?: string;
  rewards: any[];
  badges: any[];
}

export function configureLeaderboardRoutes(app: express.Express, prefix = '/api') {
  // Get global leaderboard
  app.get(`${prefix}/feltrinelli/leaderboard`, async (req, res) => {
    try {
      const period = req.query.period as string || 'all_time';
      const limit = parseInt(req.query.limit as string || '10');
      
      // Validate period
      if (!['all_time', 'monthly', 'weekly'].includes(period)) {
        return res.status(400).json({ error: 'Invalid period parameter' });
      }
      
      let query = `
        SELECT l.id, l.user_id, l.points, u.username, u.avatar_url
        FROM flt_leaderboard l
        JOIN flt_users u ON l.user_id = u.id
        WHERE l.period = $1
        ORDER BY l.points DESC
        LIMIT $2
      `;
      
      const result = await db.execute(query, [period, limit]);
      
      // Format the response to match the expected structure
      const formattedData = result.rows.map((row: LeaderboardRow): LeaderboardEntry => ({
        id: row.id,
        user_id: row.user_id,
        points: row.points,
        users: {
          username: row.username,
          avatar_url: row.avatar_url
        }
      }));
      
      res.json({ data: formattedData });
    } catch (error) {
      console.error('[API] Error fetching global leaderboard:', error);
      res.status(500).json({ error: 'Error fetching global leaderboard' });
    }
  });
  
  // Get game-specific leaderboard
  app.get(`${prefix}/feltrinelli/leaderboard/:gameType`, async (req, res) => {
    try {
      const gameType = req.params.gameType;
      const period = req.query.period as string || 'all_time';
      const limit = parseInt(req.query.limit as string || '10');
      
      // Validate period
      if (!['all_time', 'monthly', 'weekly'].includes(period)) {
        return res.status(400).json({ error: 'Invalid period parameter' });
      }
      
      // First, get the game ID from the game type
      const gameResult = await db.execute(`
        SELECT id FROM flt_games WHERE feltrinelli_game_id = $1
      `, [gameType]);
      
      if (gameResult.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      const gameId = gameResult.rows[0].id;
      
      // Now get the leaderboard for this game
      const query = `
        SELECT l.id, l.user_id, l.game_id, l.points, u.username, u.avatar_url
        FROM flt_leaderboard l
        JOIN flt_users u ON l.user_id = u.id
        WHERE l.game_id = $1 AND l.period = $2
        ORDER BY l.points DESC
        LIMIT $3
      `;
      
      const result = await db.execute(query, [gameId, period, limit]);
      
      // Format the response to match the expected structure
      const formattedData = result.rows.map((row: LeaderboardRow): LeaderboardEntry => ({
        id: row.id,
        user_id: row.user_id,
        game_id: row.game_id,
        points: row.points,
        users: {
          username: row.username,
          avatar_url: row.avatar_url
        }
      }));
      
      res.json({ data: formattedData });
    } catch (error) {
      console.error('[API] Error fetching game leaderboard:', error);
      res.status(500).json({ error: 'Error fetching game leaderboard' });
    }
  });
  
  // Submit score to leaderboard
  app.post(`${prefix}/feltrinelli/score`, async (req, res) => {
    try {
      const { userId, gameType, correctAnswers, totalQuestions, sessionId } = req.body;
      
      // Validate required fields
      if (!userId || !gameType || correctAnswers === undefined || !totalQuestions || !sessionId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Get game ID from game type
      const gameResult = await db.execute(`
        SELECT id FROM flt_games WHERE feltrinelli_game_id = $1
      `, [gameType]);
      
      if (gameResult.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }
      
      const gameId = gameResult.rows[0].id;
      
      // Calculate points (simple algorithm: correctAnswers / totalQuestions * 100)
      const points = Math.round((correctAnswers / totalQuestions) * 100);
      
      // Update all_time leaderboard
      await updateLeaderboard(userId, gameId, points, 'all_time');
      
      // Update monthly leaderboard
      await updateLeaderboard(userId, gameId, points, 'monthly');
      
      // Update weekly leaderboard
      await updateLeaderboard(userId, gameId, points, 'weekly');
      
      // Check for rewards
      await checkForRewards(userId, gameId, points);
      
      res.json({
        success: true,
        message: 'Score updated successfully'
      });
    } catch (error) {
      console.error('[API] Error submitting score:', error);
      res.status(500).json({ error: 'Error submitting score' });
    }
  });
  
  // Get client-specific leaderboard with rewards and badges
  app.get(`${prefix}/:clientId/leaderboard`, async (req, res) => {
    try {
      const clientId = req.params.clientId;
      const period = req.query.period as string || 'all_time';
      const limit = parseInt(req.query.limit as string || '10');
      
      // Validate period
      if (!['all_time', 'monthly', 'weekly'].includes(period)) {
        return res.status(400).json({ error: 'Invalid period parameter' });
      }
      
      // Query per ottenere la classifica con utenti
      const query = `
        SELECT 
          l.id, 
          l.user_id, 
          l.game_id, 
          l.points, 
          u.username, 
          u.avatar_url,
          g.name as game_name
        FROM leaderboards l
        JOIN users u ON l.user_id = u.id
        JOIN games g ON l.game_id = g.id
        WHERE l.client_id = $1 AND l.period = $2
        ORDER BY l.points DESC
        LIMIT $3
      `;
      
      const result = await db.execute(query, [clientId, period, limit]);
      
      // Ottieni i premi e i badge per ogni utente nella classifica
      const leaderboardWithRewards = await Promise.all(
        result.rows.map(async (row: LeaderboardRow): Promise<LeaderboardEntryWithRewards> => {
          // Ottieni i premi dell'utente
          const rewardsQuery = `
            SELECT r.*
            FROM rewards r
            JOIN user_rewards ur ON r.id = ur.reward_id
            WHERE ur.user_id = $1 AND ur.game_id = $2 AND ur.period = $3 AND r.client_id = $4
          `;
          const rewardsResult = await db.execute(rewardsQuery, [row.user_id, row.game_id, period, clientId]);
          
          // Ottieni i badge dell'utente
          const badgesQuery = `
            SELECT b.*
            FROM badges b
            JOIN user_badges ub ON b.id = ub.badge_id
            WHERE ub.user_id = $1 AND ub.game_id = $2 AND b.client_id = $3
          `;
          const badgesResult = await db.execute(badgesQuery, [row.user_id, row.game_id, clientId]);
          
          // Formatta la risposta
          return {
            id: row.id,
            user_id: row.user_id,
            game_id: row.game_id,
            game_name: row.game_name,
            points: row.points,
            users: {
              username: row.username,
              avatar_url: row.avatar_url
            },
            rewards: rewardsResult.rows,
            badges: badgesResult.rows
          };
        })
      );
      
      res.json({ data: leaderboardWithRewards });
    } catch (error) {
      console.error(`[API] Error fetching leaderboard for client ${req.params.clientId}:`, error);
      res.status(500).json({ error: 'Error fetching leaderboard' });
    }
  });
  
  // Endpoint specifico per Feltrinelli
  app.get(`${prefix}/feltrinelli/leaderboard-with-rewards`, async (req, res) => {
    // Reindirizza alla versione generica con l'ID client di Feltrinelli
    const feltrinelliClientId = 'client-id-feltrinelli'; // Sostituisci con l'ID effettivo
    
    // Fix: Use type assertion to tell TypeScript that params can have clientId
    (req.params as any).clientId = feltrinelliClientId;
    
    // Usa la stessa logica dell'endpoint generico
    await getClientLeaderboard(req, res);
  });
  
  // Funzione helper per ottenere la classifica di un client
  async function getClientLeaderboard(req: express.Request, res: express.Response) {
    try {
      const clientId = req.params.clientId;
      const period = req.query.period as string || 'all_time';
      const limit = parseInt(req.query.limit as string || '10');
      
      // Validate period
      if (!['all_time', 'monthly', 'weekly'].includes(period)) {
        return res.status(400).json({ error: 'Invalid period parameter' });
      }
      
      // Query per ottenere la classifica con utenti
      const query = `
        SELECT 
          l.id, 
          l.user_id, 
          l.game_id, 
          l.points, 
          u.username, 
          u.avatar_url,
          g.name as game_name
        FROM leaderboards l
        JOIN users u ON l.user_id = u.id
        JOIN games g ON l.game_id = g.id
        WHERE l.client_id = $1 AND l.period = $2
        ORDER BY l.points DESC
        LIMIT $3
      `;
      
      const result = await db.execute(query, [clientId, period, limit]);
      
      // Ottieni i premi e i badge per ogni utente nella classifica
      const leaderboardWithRewards = await Promise.all(
        result.rows.map(async (row: LeaderboardRow): Promise<LeaderboardEntryWithRewards> => {
          // Ottieni i premi dell'utente
          const rewardsQuery = `
            SELECT r.*
            FROM rewards r
            JOIN user_rewards ur ON r.id = ur.reward_id
            WHERE ur.user_id = $1 AND ur.game_id = $2 AND ur.period = $3 AND r.client_id = $4
          `;
          const rewardsResult = await db.execute(rewardsQuery, [row.user_id, row.game_id, period, clientId]);
          
          // Ottieni i badge dell'utente
          const badgesQuery = `
            SELECT b.*
            FROM badges b
            JOIN user_badges ub ON b.id = ub.badge_id
            WHERE ub.user_id = $1 AND ub.game_id = $2 AND b.client_id = $3
          `;
          const badgesResult = await db.execute(badgesQuery, [row.user_id, row.game_id, clientId]);
          
          // Formatta la risposta
          return {
            id: row.id,
            user_id: row.user_id,
            game_id: row.game_id,
            game_name: row.game_name,
            points: row.points,
            users: {
              username: row.username,
              avatar_url: row.avatar_url
            },
            rewards: rewardsResult.rows,
            badges: badgesResult.rows
          };
        })
      );
      
      res.json({ data: leaderboardWithRewards });
    } catch (error) {
      console.error(`[API] Error fetching leaderboard for client ${req.params.clientId}:`, error);
      res.status(500).json({ error: 'Error fetching leaderboard' });
    }
  }
  
  // Helper function to update leaderboard
  async function updateLeaderboard(userId: string, gameId: string, points: number, period: string) {
    // Check if user already has an entry for this game and period
    const existingEntry = await db.execute(`
      SELECT id, points FROM flt_leaderboard
      WHERE user_id = $1 AND game_id = $2 AND period = $3
    `, [userId, gameId, period]);
    
    if (existingEntry.rows.length > 0) {
      // Update only if new score is higher
      if (points > existingEntry.rows[0].points) {
        await db.execute(`
          UPDATE flt_leaderboard
          SET points = $1, updated_at = NOW()
          WHERE id = $2
        `, [points, existingEntry.rows[0].id]);
        
        // Aggiorna i rank per tutti gli utenti in questa classifica
        await updateRanks(gameId, period);
      }
    } else {
      // Create new entry
      await db.execute(`
        INSERT INTO flt_leaderboard (user_id, game_id, points, period)
        VALUES ($1, $2, $3, $4)
      `, [userId, gameId, points, period]);
      
      // Aggiorna i rank per tutti gli utenti in questa classifica
      await updateRanks(gameId, period);
    }
  }
  
  // Nuova funzione per aggiornare i rank
  async function updateRanks(gameId: string, period: string) {
    // Aggiorna i rank usando una query con window function
    await db.execute(`
      WITH ranked_users AS (
        SELECT 
          id,
          RANK() OVER (ORDER BY points DESC) as new_rank
        FROM flt_leaderboard
        WHERE game_id = $1 AND period = $2
      )
      UPDATE flt_leaderboard l
      SET rank = r.new_rank
      FROM ranked_users r
      WHERE l.id = r.id
    `, [gameId, period]);
  }
  
  // Helper function to check for rewards
  async function checkForRewards(userId: string, gameId: string, points: number) {
    // Get user's rank in each period
    const periods = ['all_time', 'monthly', 'weekly'];
    
    for (const period of periods) {
      // Get user's rank
      const rankResult = await db.execute(`
        SELECT 
          user_id,
          RANK() OVER (ORDER BY points DESC) as rank
        FROM flt_leaderboard
        WHERE game_id = $1 AND period = $2
        ORDER BY points DESC
      `, [gameId, period]);
      
      // Modifica: Aggiungi tipo esplicito per il parametro row
      const userRank = rankResult.rows.find((row: { user_id: string; rank: number }) => row.user_id === userId)?.rank;
      
      if (!userRank || userRank > 3) continue; // Only check top 3 positions
      
      // Get rewards for this game, period and rank
      const rewardsResult = await db.execute(`
        SELECT r.id
        FROM flt_rewards r
        JOIN reward_games rg ON r.id = rg.reward_id
        WHERE rg.game_id = $1 AND rg.leaderboard_type = $2 AND rg.position = $3
        AND r.is_active = true
      `, [gameId, period, userRank]);
      
      // Award rewards to user
      for (const reward of rewardsResult.rows) {
        // Check if user already has this reward
        const existingReward = await db.execute(`
          SELECT id FROM user_rewards
          WHERE user_id = $1 AND reward_id = $2 AND game_id = $3 AND period = $4
        `, [userId, reward.id, gameId, period]);
        
        if (existingReward.rows.length === 0) {
          // Award new reward
          await db.execute(`
            INSERT INTO user_rewards (user_id, reward_id, game_id, period, rank)
            VALUES ($1, $2, $3, $4, $5)
          `, [userId, reward.id, gameId, period, userRank]);
        }
      }
    }
  }
}
