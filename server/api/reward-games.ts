import express from 'express';
import { db } from '../db';

// Funzione base che configura le route generiche
export function configureRewardGamesRoutes(app: express.Express, prefix = '/api') {
  // Get all games associated with a reward
  app.get(`${prefix}/rewards/:rewardId/games`, async (req: express.Request, res: express.Response) => {
    try {
      // Non convertire in intero, è un UUID
      const rewardId = req.params.rewardId;
      
      const result = await db.execute(`
        SELECT g.*, rg.leaderboard_type as "leaderboardType"
        FROM games g
        JOIN reward_games rg ON g.id = rg.game_id
        WHERE rg.reward_id = $1::uuid
        ORDER BY g.name
      `, [rewardId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[API] Error fetching games for reward:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      res.status(500).json({ error: 'Error fetching games for reward' });
    }
  });
  
  // Delete all game associations for a reward
  app.delete(`${prefix}/rewards/:rewardId/games`, async (req: express.Request, res: express.Response) => {
    try {
      // Non convertire in intero, è un UUID
      const rewardId = req.params.rewardId;
      
      await db.execute('DELETE FROM reward_games WHERE reward_id = $1::uuid', [rewardId]);
      
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error deleting game associations:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      res.status(500).json({ error: 'Error deleting game associations' });
    }
  });
  
  // Associate a game with a reward
  app.post(`${prefix}/rewards/:rewardId/games/:gameId`, async (req: express.Request, res: express.Response) => {
    try {
      // Non convertire in intero, sono UUID
      const rewardId = req.params.rewardId;
      const gameId = req.params.gameId;
      const { leaderboardType, position = 1 } = req.body;
      
      // Validate leaderboard type
      if (!['weekly', 'monthly', 'global'].includes(leaderboardType)) {
        return res.status(400).json({ error: 'Invalid leaderboard type' });
      }
      
      // Check if association already exists
      const existing = await db.execute(
        'SELECT * FROM reward_games WHERE reward_id = $1::uuid AND game_id = $2::uuid AND leaderboard_type = $3',
        [rewardId, gameId, leaderboardType]
      );
      
      if (existing.rows.length > 0) {
        // Update position if it exists
        await db.execute(`
          UPDATE reward_games 
          SET position = $1, updated_at = NOW() 
          WHERE reward_id = $2::uuid AND game_id = $3::uuid AND leaderboard_type = $4
        `, [position, rewardId, gameId, leaderboardType]);
        
        return res.json(existing.rows[0]); // Return the existing association
      }
      
      // Create new association
      const result = await db.execute(
        `INSERT INTO reward_games (reward_id, game_id, leaderboard_type, position) 
         VALUES ($1::uuid, $2::uuid, $3, $4) 
         RETURNING *`,
        [rewardId, gameId, leaderboardType, position]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('[API] Error associating game with reward:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      res.status(500).json({ error: 'Error associating game with reward' });
    }
  });
  
  // Remove a specific association between a game and a reward
  app.delete(`${prefix}/rewards/:rewardId/games/:gameId`, async (req: express.Request, res: express.Response) => {
    try {
      // Non convertire in intero, sono UUID
      const rewardId = req.params.rewardId;
      const gameId = req.params.gameId;
      const leaderboardType = req.query.leaderboardType as string;
      
      let query = 'DELETE FROM reward_games WHERE reward_id = $1::uuid AND game_id = $2::uuid';
      const params: any[] = [rewardId, gameId];
      
      if (leaderboardType) {
        query += ' AND leaderboard_type = $3';
        params.push(leaderboardType);
      }
      
      await db.execute(query, params);
      
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error removing game-reward association:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      res.status(500).json({ error: 'Error removing game-reward association' });
    }
  });
  
  // Get all rewards for a game and leaderboard type
  app.get(`${prefix}/games/:gameId/rewards`, async (req: express.Request, res: express.Response) => {
    try {
      // Non convertire in intero, è un UUID
      const gameId = req.params.gameId;
      const leaderboardType = req.query.leaderboardType as string;
      
      console.log('Fetching rewards for game:', {
        gameId,
        paramType: typeof gameId
      });
      
      let query = `
        SELECT r.*, rg.leaderboard_type as "leaderboardType", rg.position
        FROM rewards r
        JOIN reward_games rg ON r.id = rg.reward_id
        WHERE rg.game_id = $1::uuid
      `;
      
      const params: any[] = [gameId];
      
      if (leaderboardType) {
        query += ' AND rg.leaderboard_type = $2';
        params.push(leaderboardType);
      }
      
      query += ' ORDER BY rg.position, r.points DESC';
      
      const result = await db.execute(query, params);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[API] Error fetching rewards for game:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      res.status(500).json({ error: 'Error fetching rewards for game' });
    }
  });
  
  // Delete all reward associations for a game
  app.delete(`${prefix}/games/:gameId/rewards`, async (req: express.Request, res: express.Response) => {
    try {
      // Non convertire in intero, è un UUID
      const gameId = req.params.gameId;
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
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      res.status(500).json({ error: 'Error deleting reward associations for game' });
    }
  });
  
  // Associate a reward with a game
  app.post(`${prefix}/games/:gameId/rewards/:rewardId`, async (req: express.Request, res: express.Response) => {
    try {
      // Non convertire in intero, sono UUID
      const gameId = req.params.gameId;
      const rewardId = req.params.rewardId;
      const { leaderboardType, position = 1 } = req.body;
      
      // Validate leaderboard type
      if (!['weekly', 'monthly', 'global'].includes(leaderboardType)) {
        return res.status(400).json({ error: 'Invalid leaderboard type. Must be weekly, monthly, or global.' });
      }
      
      // Check if the association already exists
      const existingResult = await db.execute(`
        SELECT * FROM reward_games 
        WHERE game_id = $1::uuid AND reward_id = $2::uuid AND leaderboard_type = $3
      `, [gameId, rewardId, leaderboardType]);
      
      if (existingResult.rowCount > 0) {
        // Update the existing association with the new position
        await db.execute(`
          UPDATE reward_games 
          SET position = $1, updated_at = NOW() 
          WHERE game_id = $2::uuid AND reward_id = $3::uuid AND leaderboard_type = $4
        `, [position, gameId, rewardId, leaderboardType]);
        
        return res.json(existingResult.rows[0]); // Return the existing association
      } else {
        // Create a new association
        const result = await db.execute(`
          INSERT INTO reward_games (game_id, reward_id, leaderboard_type, position) 
          VALUES ($1::uuid, $2::uuid, $3, $4) 
          RETURNING *
        `, [gameId, rewardId, leaderboardType, position]);
        
        res.status(201).json(result.rows[0]);
      }
    } catch (error) {
      console.error('[API] Error associating reward with game:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      res.status(500).json({ error: 'Error associating reward with game' });
    }
  });
  
  // Remove a specific association between a reward and a game
  app.delete(`${prefix}/games/:gameId/rewards/:rewardId`, async (req: express.Request, res: express.Response) => {
    try {
      // Non convertire in intero, sono UUID
      const gameId = req.params.gameId;
      const rewardId = req.params.rewardId;
      const leaderboardType = req.query.leaderboardType as string;
      
      let query = 'DELETE FROM reward_games WHERE game_id = $1::uuid AND reward_id = $2::uuid';
      const params: any[] = [gameId, rewardId];
      
      if (leaderboardType) {
        query += ' AND leaderboard_type = $3';
        params.push(leaderboardType);
      }
      
      await db.execute(query, params);
      
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error removing reward-game association:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
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
      
      // Non convertire gli ID in interi, usali direttamente come UUID
      const placeholders = gameIds.map((_: any, index: number) => `$${index + 2}`).join(',');
      
      const query = `
        SELECT r.*, rg.leaderboard_type as "leaderboardType", rg.game_id as "gameId"
        FROM rewards r
        JOIN reward_games rg ON r.id = rg.reward_id
        WHERE rg.game_id IN (${placeholders})
        AND rg.leaderboard_type = $1
        AND r.is_active = true
        ORDER BY r.points DESC
      `;
      
      const params = [leaderboardType, ...gameIds];
      
      const result = await db.execute(query, params);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[API] Error fetching rewards for multiple games:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      res.status(500).json({ error: 'Error fetching rewards for multiple games' });
    }
  });
}

// Funzione specializzata per Feltrinelli


// Importa il middleware di autenticazione
import { verifyClientToken } from '../middleware/auth';

export function configureFeltrinelliRewardGamesRoutes(app: express.Express) {
  // Ottieni tutti i premi associati a un gioco
  app.get('/api/feltrinelli-legacy/games/:gameId/rewards', async (req, res) => {
    try {
      const gameId = req.params.gameId;
      
      console.log('[FeltrinelliRewardGames] Fetching rewards for game:', {
        gameId,
        gameIdType: typeof gameId
      });
      
      // Modifica qui per gestire correttamente UUID
      const result = await db.execute(`
        SELECT r.*, rg.leaderboard_type as "leaderboardType", rg.position
        FROM flt_rewards r
        JOIN reward_games rg ON r.id = rg.reward_id
        WHERE rg.game_id = $1::uuid
        ORDER BY rg.position ASC, r.name ASC
      `, [gameId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[API] Error fetching rewards for game:', error);
      res.status(500).json({ error: 'Error fetching rewards for game' });
    }
  });
  
  // Associa un premio a un gioco
  app.post('/api/feltrinelli-legacy/games/:gameId/rewards/:rewardId', async (req, res) => {
    try {
      const { gameId, rewardId } = req.params;
      const { leaderboardType = 'weekly', position = 1 } = req.body;
      
      console.log('[FeltrinelliRewardGames] Associating reward with game:', {
        gameId,
        rewardId,
        leaderboardType,
        position
      });
      
      // Modifica qui per gestire correttamente UUID
      const result = await db.execute(`
        INSERT INTO reward_games (game_id, reward_id, leaderboard_type, position)
        VALUES ($1::uuid, $2::uuid, $3, $4)
        ON CONFLICT (game_id, reward_id, leaderboard_type) 
        DO UPDATE SET position = $4
        RETURNING *
      `, [gameId, rewardId, leaderboardType, position]);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('[API] Error associating reward with game:', error);
      res.status(500).json({ error: 'Error associating reward with game' });
    }
  });
  
  // Rimuovi associazione premio-gioco
  app.delete('/api/feltrinelli-legacy/games/:gameId/rewards/:rewardId', async (req, res) => {
    try {
      const { gameId, rewardId } = req.params;
      const leaderboardType = req.query.leaderboardType as string;
      
      let query = 'DELETE FROM reward_games WHERE game_id = $1::uuid AND reward_id = $2::uuid';
      const params: any[] = [gameId, rewardId];
      
      if (leaderboardType) {
        query += ' AND leaderboard_type = $3';
        params.push(leaderboardType);
      }
      
      await db.execute(query, params);
      
      res.status(204).send();
    } catch (error) {
      console.error('[API] Error removing reward from game:', error);
      res.status(500).json({ error: 'Error removing reward from game' });
    }
  });
  
  // Ottieni tutti i giochi associati a un premio
  app.get('/api/feltrinelli-legacy/rewards/:rewardId/games', async (req, res) => {
    try {
      const rewardId = req.params.rewardId;
      
      // Modifica qui per gestire correttamente UUID
      const result = await db.execute(`
        SELECT g.*, rg.leaderboard_type as "leaderboardType", rg.position
        FROM flt_games g
        JOIN reward_games rg ON g.id = rg.game_id
        WHERE rg.reward_id = $1::uuid
        ORDER BY g.name ASC
      `, [rewardId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error('[API] Error fetching games for reward:', error);
      res.status(500).json({ error: 'Error fetching games for reward' });
    }
  });
  
  // Endpoint per il client per ottenere i premi configurati per un gioco specifico
  app.get('/api/client/games/:gameId/rewards', verifyClientToken, async (req, res) => {
    try {
      const { gameId } = req.params;
      const leaderboardType = req.query.leaderboardType as string || 'global'; // Default a global
      
      console.log(`[API Client Rewards] Recupero premi per gameId: ${gameId}, leaderboardType: ${leaderboardType}`);
      
      // Verifica che il client sia autenticato
      if (!req.client || !req.client.clientId) {
        console.error('[API Client Rewards] Client ID non trovato nella richiesta');
        return res.status(401).json({ error: 'Client non autenticato correttamente' });
      }
      
      // Verifica che il gioco esista e sia attivo
      const gameResult = await db.execute(`
        SELECT id, name FROM flt_games WHERE id = $1 AND is_active = true
      `, [gameId]);
      
      if (gameResult.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found or not active' });
      }
      
      // Verifica le associazioni esistenti per questo gioco
      const associationsCheck = await db.execute(`
        SELECT COUNT(*) FROM reward_games 
        WHERE game_id = $1::uuid AND leaderboard_type = $2
      `, [gameId, leaderboardType]);
      
      console.log(`[API Client Rewards] Trovate ${associationsCheck.rows[0].count} associazioni per gameId=${gameId}, leaderboardType=${leaderboardType}`);
      
      // Recupera SOLO i premi ESPLICITAMENTE configurati per questo gioco e tipo di classifica
      const result = await db.execute(`
        SELECT r.*, rg.position, rg.id as association_id
        FROM flt_rewards r
        JOIN reward_games rg ON r.id = rg.reward_id
        WHERE rg.game_id = $1::uuid
          AND rg.leaderboard_type = $2
          AND r.is_active = true
        ORDER BY rg.position ASC
      `, [gameId, leaderboardType]);
      
      // Log dettagliato per debug
      console.log(`[API Client Rewards] Query ha trovato ${result.rows.length} premi`);
      if (result.rows.length > 0) {
        console.log(`[API Client Rewards] Premi trovati:`);
        result.rows.forEach((r: any, i: number) => {
          console.log(`  ${i+1}. ${r.name} (ID: ${r.id}, Pos: ${r.position}, Assoc ID: ${r.association_id})`);
        });
      }
      
      // Verifica se abbiamo trovato premi configurati
      if (result.rows.length === 0) {
        console.log(`[API Client Rewards] Nessun premio configurato per il gioco ${gameResult.rows[0].name} con leaderboardType=${leaderboardType}`);
        return res.json({
          data: [],
          game: {
            id: gameResult.rows[0].id,
            name: gameResult.rows[0].name
          },
          leaderboardType
        });
      }
      
      // Formatta la risposta
      const formattedRewards = result.rows.map((reward: any) => {
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
          position: reward.position,
          icon: reward.icon,
          color: reward.color
        };
      });
      
      console.log(`[API Client Rewards] Risposta formattata con ${formattedRewards.length} premi`);
      
      res.json({ 
        data: formattedRewards,
        game: {
          id: gameResult.rows[0].id,
          name: gameResult.rows[0].name
        },
        leaderboardType
      });
    } catch (error) {
      console.error('[API Client Rewards] Errore durante il recupero dei premi:', error);
      res.status(500).json({ 
        error: 'Errore durante il recupero dei premi',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  });
}