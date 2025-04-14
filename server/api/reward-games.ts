import express from 'express';
import { db } from '../db';

// Funzione base che configura le route generiche
export function configureRewardGamesRoutes(app: express.Express, prefix = '/api') {
  // Get all games associated with a reward
  app.get(`${prefix}/rewards/:rewardId/games`, async (req: express.Request, res: express.Response) => {
    try {
      const rewardId = parseInt(req.params.rewardId);
      
      const result = await db.execute(`
        SELECT g.*, rg.leaderboard_type as "leaderboardType"
        FROM games g
        JOIN reward_games rg ON g.id = rg.game_id
        WHERE rg.reward_id = $1
        ORDER BY g.name
      `, [rewardId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[API] Error fetching games for reward:', error);
      res.status(500).json({ error: 'Error fetching games for reward' });
    }
  });
  
  // Delete all game associations for a reward
  app.delete(`${prefix}/rewards/:rewardId/games`, async (req: express.Request, res: express.Response) => {
    try {
      const rewardId = parseInt(req.params.rewardId);
      
      await db.execute('DELETE FROM reward_games WHERE reward_id = $1', [rewardId]);
      
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting game associations:', error);
      res.status(500).json({ error: 'Error deleting game associations' });
    }
  });
  
  // Associate a game with a reward
  app.post(`${prefix}/rewards/:rewardId/games/:gameId`, async (req: express.Request, res: express.Response) => {
    try {
      const rewardId = parseInt(req.params.rewardId);
      const gameId = parseInt(req.params.gameId);
      const { leaderboardType } = req.body;
      
      // Validate leaderboard type
      if (!['weekly', 'monthly', 'global'].includes(leaderboardType)) {
        return res.status(400).json({ error: 'Invalid leaderboard type' });
      }
      
      // Check if association already exists
      const existing = await db.execute(
        'SELECT * FROM reward_games WHERE reward_id = $1 AND game_id = $2 AND leaderboard_type = $3',
        [rewardId, gameId, leaderboardType]
      );
      
      if (existing.rows.length > 0) {
        return res.json(existing.rows[0]); // Already exists, return it
      }
      
      // Create new association
      const result = await db.execute(
        `INSERT INTO reward_games (reward_id, game_id, leaderboard_type) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [rewardId, gameId, leaderboardType]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('[API] Error associating game with reward:', error);
      res.status(500).json({ error: 'Error associating game with reward' });
    }
  });
  
  // Remove a specific association between a game and a reward
  app.delete(`${prefix}/rewards/:rewardId/games/:gameId`, async (req: express.Request, res: express.Response) => {
    try {
      const rewardId = parseInt(req.params.rewardId);
      const gameId = parseInt(req.params.gameId);
      const leaderboardType = req.query.leaderboardType as string;
      
      let query = 'DELETE FROM reward_games WHERE reward_id = $1 AND game_id = $2';
      const params: any[] = [rewardId, gameId];
      
      if (leaderboardType) {
        query += ' AND leaderboard_type = $3';
        params.push(leaderboardType);
      }
      
      await db.execute(query, params);
      
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error removing game-reward association:', error);
      res.status(500).json({ error: 'Error removing game-reward association' });
    }
  });
  
  // Get all rewards for a game and leaderboard type
  app.get(`${prefix}/games/:gameId/rewards`, async (req: express.Request, res: express.Response) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const leaderboardType = req.query.leaderboardType as string;
      
      let query = `
        SELECT r.*, rg.leaderboard_type as "leaderboardType"
        FROM rewards r
        JOIN reward_games rg ON r.id = rg.reward_id
        WHERE rg.game_id = $1
      `;
      
      const params: any[] = [gameId];
      
      if (leaderboardType) {
        query += ' AND rg.leaderboard_type = $2';
        params.push(leaderboardType);
      }
      
      query += ' ORDER BY r.points DESC';
      
      const result = await db.execute(query, params);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[API] Error fetching rewards for game:', error);
      res.status(500).json({ error: 'Error fetching rewards for game' });
    }
  });
  
  // Delete all reward associations for a game
  app.delete(`${prefix}/games/:gameId/rewards`, async (req: express.Request, res: express.Response) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const leaderboardType = req.query.leaderboardType as string;
      
      let query = 'DELETE FROM reward_games WHERE game_id = $1';
      const params: any[] = [gameId];
      
      if (leaderboardType) {
        query += ' AND leaderboard_type = $2';
        params.push(leaderboardType);
      }
      
      await db.execute(query, params);
      
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting reward associations for game:', error);
      res.status(500).json({ error: 'Error deleting reward associations for game' });
    }
  });
  
  // Associate a reward with a game
  app.post(`${prefix}/games/:gameId/rewards/:rewardId`, async (req: express.Request, res: express.Response) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const rewardId = parseInt(req.params.rewardId);
      const { leaderboardType } = req.body;
      
      // Validate leaderboard type
      if (!['weekly', 'monthly', 'global'].includes(leaderboardType)) {
        return res.status(400).json({ error: 'Invalid leaderboard type' });
      }
      
      // Check if association already exists
      const existing = await db.execute(
        'SELECT * FROM reward_games WHERE game_id = $1 AND reward_id = $2 AND leaderboard_type = $3',
        [gameId, rewardId, leaderboardType]
      );
      
      if (existing.rows.length > 0) {
        return res.json(existing.rows[0]); // Already exists, return it
      }
      
      // Create new association
      const result = await db.execute(
        `INSERT INTO reward_games (game_id, reward_id, leaderboard_type) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [gameId, rewardId, leaderboardType]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('[API] Error associating reward with game:', error);
      res.status(500).json({ error: 'Error associating reward with game' });
    }
  });
  
  // Remove a specific association between a reward and a game
  app.delete(`${prefix}/games/:gameId/rewards/:rewardId`, async (req: express.Request, res: express.Response) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const rewardId = parseInt(req.params.rewardId);
      const leaderboardType = req.query.leaderboardType as string;
      
      let query = 'DELETE FROM reward_games WHERE game_id = $1 AND reward_id = $2';
      const params: any[] = [gameId, rewardId];
      
      if (leaderboardType) {
        query += ' AND leaderboard_type = $3';
        params.push(leaderboardType);
      }
      
      await db.execute(query, params);
      
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error removing reward-game association:', error);
      res.status(500).json({ error: 'Error removing reward-game association' });
    }
  });
  
  // Get rewards for multiple games (for client use)
  app.post(`${prefix}/games/rewards`, async (req: express.Request, res: express.Response) => {
    try {
      const { gameIds, leaderboardType } = req.body;
      
      if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
        return res.status(400).json({ error: 'Invalid or missing gameIds' });
      }
      
      if (!leaderboardType || !['weekly', 'monthly', 'global'].includes(leaderboardType)) {
        return res.status(400).json({ error: 'Invalid or missing leaderboardType' });
      }
      
      // Convert gameIds to integers and create placeholders for the query
      const gameIdsInt = gameIds.map(id => parseInt(id));
      const placeholders = gameIdsInt.map((_, index) => `$${index + 2}`).join(',');
      
      const query = `
        SELECT r.*, rg.leaderboard_type as "leaderboardType", rg.game_id as "gameId"
        FROM rewards r
        JOIN reward_games rg ON r.id = rg.reward_id
        WHERE rg.game_id IN (${placeholders})
        AND rg.leaderboard_type = $1
        AND r.is_active = true
        ORDER BY r.points DESC
      `;
      
      const params = [leaderboardType, ...gameIdsInt];
      
      const result = await db.execute(query, params);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[API] Error fetching rewards for multiple games:', error);
      res.status(500).json({ error: 'Error fetching rewards for multiple games' });
    }
  });
  
  console.log('[Server] Reward-games routes configurate');
}

// Funzione specializzata per Feltrinelli
export function configureFeltrinelliRewardGamesRoutes(app: express.Express) {
  // Configura le route base con il prefisso Feltrinelli
  configureRewardGamesRoutes(app, '/api/feltrinelli');
  
  // Aggiungi eventuali route specifiche per Feltrinelli
  app.get('/api/feltrinelli/rewards/:rewardId/special-games', async (req, res) => {
    try {
      const rewardId = parseInt(req.params.rewardId);
      
      // Esempio di logica specifica per Feltrinelli
      const result = await db.execute(`
        SELECT g.*, rg.leaderboard_type as "leaderboardType"
        FROM games g
        JOIN reward_games rg ON g.id = rg.game_id
        WHERE rg.reward_id = $1
        AND g.client_id = 'feltrinelli'
        ORDER BY g.name
      `, [rewardId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[API] Error fetching special games for reward:', error);
      res.status(500).json({ error: 'Error fetching special games for reward' });
    }
  });
  
  // Associate a game with a reward
  app.post('/api/feltrinelli/games/:gameId/rewards/:rewardId', async (req: express.Request, res: express.Response) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const rewardId = parseInt(req.params.rewardId);
      const { leaderboardType, position = 1 } = req.body;
      
      // Validate leaderboard type
      if (!['weekly', 'monthly', 'global'].includes(leaderboardType)) {
        return res.status(400).json({ error: 'Invalid leaderboard type. Must be weekly, monthly, or global.' });
      }
      
      // Check if the association already exists
      const existingResult = await db.execute(`
        SELECT * FROM reward_games 
        WHERE game_id = $1 AND reward_id = $2 AND leaderboard_type = $3
      `, [gameId, rewardId, leaderboardType]);
      
      if (existingResult.rowCount > 0) {
        // Update the existing association with the new position
        await db.execute(`
          UPDATE reward_games 
          SET position = $1, updated_at = NOW() 
          WHERE game_id = $2 AND reward_id = $3 AND leaderboard_type = $4
        `, [position, gameId, rewardId, leaderboardType]);
      } else {
        // Create a new association
        await db.execute(`
          INSERT INTO reward_games (game_id, reward_id, leaderboard_type, position, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [gameId, rewardId, leaderboardType, position]);
      }
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error('[API] Error associating reward with game:', error);
      res.status(500).json({ error: 'Error associating reward with game' });
    }
  });
  
  // Get all rewards associated with a game
  app.get('/api/feltrinelli/games/:gameId/rewards', async (req: express.Request, res: express.Response) => {
    try {
      const gameId = parseInt(req.params.gameId);
      
      const result = await db.execute(`
        SELECT r.*, rg.leaderboard_type as "leaderboardType", rg.position
        FROM rewards r
        JOIN reward_games rg ON r.id = rg.reward_id
        WHERE rg.game_id = $1
        ORDER BY rg.leaderboard_type, rg.position
      `, [gameId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[API] Error fetching rewards for game:', error);
      res.status(500).json({ error: 'Error fetching rewards for game' });
    }
  });
  
  // Remove a specific association between a reward and a game
  app.delete('/api/feltrinelli/games/:gameId/rewards/:rewardId', async (req: express.Request, res: express.Response) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const rewardId = parseInt(req.params.rewardId);
      const leaderboardType = req.query.leaderboardType as string;
      
      let query = 'DELETE FROM reward_games WHERE game_id = $1 AND reward_id = $2';
      const params: any[] = [gameId, rewardId];
      
      if (leaderboardType) {
        query += ' AND leaderboard_type = $3';
        params.push(leaderboardType);
      }
      
      await db.execute(query, params);
      
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error removing reward-game association:', error);
      res.status(500).json({ error: 'Error removing reward-game association' });
    }
  });
  
  // Get rewards for multiple games (for client use)
  app.post('/api/feltrinelli/games/rewards', async (req: express.Request, res: express.Response) => {
    try {
      const { gameIds, leaderboardType } = req.body;
      
      if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
        return res.status(400).json({ error: 'Invalid or missing gameIds' });
      }
      
      if (!leaderboardType || !['weekly', 'monthly', 'global'].includes(leaderboardType)) {
        return res.status(400).json({ error: 'Invalid or missing leaderboardType' });
      }
      
      // Convert gameIds to integers and create placeholders for the query
      const gameIdsInt = gameIds.map(id => parseInt(id));
      const placeholders = gameIdsInt.map((_, index) => `$${index + 2}`).join(',');
      
      const query = `
        SELECT r.*, rg.leaderboard_type as "leaderboardType", rg.game_id as "gameId"
        FROM rewards r
        JOIN reward_games rg ON r.id = rg.reward_id
        WHERE rg.game_id IN (${placeholders})
        AND rg.leaderboard_type = $1
        AND r.is_active = true
        ORDER BY r.points DESC
      `;
      
      const params = [leaderboardType, ...gameIdsInt];
      
      const result = await db.execute(query, params);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[API] Error fetching rewards for multiple games:', error);
      res.status(500).json({ error: 'Error fetching rewards for multiple games' });
    }
  });
  
  // Delete all reward associations for a game with specific leaderboard type
  app.delete('/api/feltrinelli/games/:gameId/rewards', async (req: express.Request, res: express.Response) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const leaderboardType = req.query.leaderboardType as string;
      
      let query = 'DELETE FROM reward_games WHERE game_id = $1';
      const params: any[] = [gameId];
      
      if (leaderboardType) {
        query += ' AND leaderboard_type = $2';
        params.push(leaderboardType);
      }
      
      await db.execute(query, params);
      
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting reward associations for game:', error);
      res.status(500).json({ error: 'Error deleting reward associations for game' });
    }
  });
  
  console.log('[Server] Feltrinelli reward-games routes configurate');
}