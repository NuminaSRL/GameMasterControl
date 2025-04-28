import express from 'express';
import { db } from '../db';
import { verifyClientToken } from '../middleware/auth';
import { supabase } from '../supabase'; // Aggiungi questa importazione

export function configureClientRewardsRoutes(app: express.Express) {
  // Endpoint dedicato per il client per ottenere SOLO i premi configurati per un gioco specifico
  app.get('/api/client/v2/games/:gameId/rewards', verifyClientToken, async (req, res) => {
    try {
      const { gameId } = req.params;
      const leaderboardType = req.query.leaderboardType as string || 'global'; // Default a global
      
      console.log(`[API Client Rewards V2] Nuovo endpoint dedicato - Recupero premi per gameId: ${gameId}, leaderboardType: ${leaderboardType}`);
      
      // Verifica che il client sia autenticato
      if (!req.client || !req.client.clientId) {
        console.error('[API Client Rewards] Client ID non trovato nella richiesta');
        return res.status(401).json({ error: 'Client non autenticato correttamente' });
      }
      
      // Verifica che il gioco esista e sia attivo
      const { data: gameData, error: gameError } = await supabase
        .from('flt_games')
        .select('id, name')
        .eq('id', gameId)
        .eq('is_active', true)
        .single();
      
      if (gameError || !gameData) {
        console.error('[API Client Rewards] Gioco non trovato o non attivo:', gameError);
        return res.status(404).json({ error: 'Game not found or not active' });
      }
      
      // Utilizziamo una query SQL diretta per garantire che otteniamo solo i premi associati
      // a questo gioco specifico e tipo di classifica
      console.log(`[API Client Rewards V2] Esecuzione query SQL per gameId: ${gameId}, leaderboardType: ${leaderboardType}`);
      
      // Modifica della query per ottenere correttamente i dettagli dei premi
      // Utilizziamo due query separate per garantire che otteniamo tutti i dati necessari
      
      // Prima query: ottieni le associazioni tra giochi e premi
      const associationsResult = await db.execute(`
        SELECT id, game_id, reward_id, position, leaderboard_type
        FROM reward_games
        WHERE game_id = $1::uuid
          AND leaderboard_type = $2
        ORDER BY position ASC
      `, [gameId, leaderboardType]);
      
      console.log(`[API Client Rewards V2] Trovate ${associationsResult.rows.length} associazioni per il gioco ${gameData.name}`);
      
      // Se non ci sono associazioni, restituisci un array vuoto
      if (associationsResult.rows.length === 0) {
        console.log(`[API Client Rewards V2] Nessun premio trovato per il gioco ${gameId} con leaderboardType=${leaderboardType}`);
        return res.json([]);
      }
      
      // Estrai gli ID dei premi dalle associazioni
      const rewardIds = associationsResult.rows.map((row: { reward_id: string }) => row.reward_id);
      console.log(`[API Client Rewards V2] ID dei premi da recuperare:`, rewardIds);
      
      // Seconda query: ottieni i dettagli dei premi
      const rewardsResult = await db.execute(`
        SELECT id, name, description, image_url, points, type, value, icon, color, available, is_active
        FROM flt_rewards
        WHERE id = ANY($1::uuid[])
          AND is_active = true
      `, [rewardIds]);
      
      console.log(`[API Client Rewards V2] Recuperati ${rewardsResult.rows.length} dettagli di premi`);
      
      // Define interfaces for our data structures
      interface RewardAssociation {
        id: number;
        game_id: string;
        reward_id: string;
        position: number;
        leaderboard_type: string;
      }
      
      interface RewardDetail {
        id: string;
        name: string;
        description: string;
        image_url: string;
        points: number;
        type: string;
        value: string;
        icon: string;
        color: string;
        available: number;
        is_active: boolean;
      }
      
      // Combina i dati delle due query
      const combinedRewards = associationsResult.rows.map((association: RewardAssociation) => {
        // Trova i dettagli del premio corrispondente
        const rewardDetails = rewardsResult.rows.find((reward: RewardDetail) => reward.id === association.reward_id);
        
        if (!rewardDetails) {
          console.log(`[API Client Rewards V2] Nessun dettaglio trovato per il premio ${association.reward_id}`);
          return null;
        }
        
        // Combina i dati
        return {
          ...association,
          ...rewardDetails
        };
      }).filter((reward: unknown): reward is (RewardAssociation & RewardDetail) => reward !== null);
      
      // Filtro aggiuntivo per assicurarsi che i premi corrispondano esattamente al gioco e al tipo di classifica richiesti
      const filteredRewards = combinedRewards.filter((reward: RewardAssociation & RewardDetail) => 
        reward.game_id === gameId && reward.leaderboard_type === leaderboardType
      );
      
      console.log(`[API Client Rewards V2] Combinati ${combinedRewards.length} premi, filtrati a ${filteredRewards.length} premi validi`);
      
      if (filteredRewards.length > 0) {
        console.log(`[API Client Rewards V2] Primo premio filtrato:`, JSON.stringify(filteredRewards[0], null, 2));
      }
      
      // Formatta la risposta
      const formattedRewards = filteredRewards.map((reward: RewardAssociation & RewardDetail) => {
        // Costruisci URL completo per le immagini se è presente un image_url
        let imageUrl = reward.image_url;
        if (imageUrl && !imageUrl.startsWith('http')) {
          // Se l'immagine è su Supabase Storage, costruisci l'URL pubblico
          const publicUrl = `https://hdguwqhxbqssdtqgilmy.supabase.co/storage/v1/object/public/uploads/${imageUrl}`;
          imageUrl = publicUrl;
        }
        
        // Assicuriamoci di includere tutti i campi necessari
        const formattedReward = {
          id: reward.id,
          name: reward.name || 'Premio senza nome',
          description: reward.description || '',
          imageUrl: imageUrl || '',
          points: reward.points || 0,
          isActive: reward.is_active,
          position: reward.position || 0,
          leaderboardType: reward.leaderboard_type,
          available: reward.available || 0,
          // Campi aggiuntivi per retrocompatibilità
          type: reward.type || 'default',
          value: reward.value || '',
          icon: reward.icon || '',
          color: reward.color || '#000000'
        };
        
        return formattedReward;
      });
      
      // Log per debug
      console.log(`[API Client Rewards V2] Numero di premi formattati: ${formattedRewards.length}`);
      
      // Restituisci direttamente l'array
      res.json(formattedRewards);
      
      // Commenta o rimuovi questo blocco
      /*
      res.json({ 
        data: formattedRewards,
        game: {
          id: gameData.id,
          name: gameData.name
        },
        leaderboardType
      });
      */
    } catch (error) {
      console.error('[API Client Rewards V2] Errore durante il recupero dei premi:', error);
      res.status(500).json({ 
        error: 'Errore durante il recupero dei premi',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  });
  
  // Endpoint di debug autenticato per verificare le associazioni tra giochi e premi
  app.get('/api/client/debug/games/:gameId/rewards', verifyClientToken, async (req, res) => {
    try {
      const { gameId } = req.params;
      const leaderboardType = req.query.leaderboardType as string || 'global';
      
      console.log(`[CLIENT DEBUG] Verifica premi per gameId: ${gameId}, leaderboardType: ${leaderboardType}`);
      
      // Verifica che il client sia autenticato
      if (!req.client || !req.client.clientId) {
        console.error('[CLIENT DEBUG] Client ID non trovato nella richiesta');
        return res.status(401).json({ error: 'Client non autenticato correttamente' });
      }
      
      // Verifica che il gioco esista e sia attivo
      const gameResult = await db.execute(`
        SELECT id, name FROM flt_games WHERE id = $1 AND is_active = true
      `, [gameId]);
      
      if (gameResult.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found or not active' });
      }
      
      // Recupera SOLO i premi ESPLICITAMENTE configurati per questo gioco e tipo di classifica
      const associationsResult = await db.execute(`
        SELECT rg.id, rg.reward_id, rg.position, r.name as reward_name
        FROM reward_games rg
        JOIN flt_rewards r ON rg.reward_id = r.id
        WHERE rg.game_id = $1::uuid
          AND rg.leaderboard_type = $2
        ORDER BY rg.position ASC
      `, [gameId, leaderboardType]);
      
      // Recupera tutti i premi attivi per confronto
      const allRewardsResult = await db.execute(`
        SELECT id, name FROM flt_rewards WHERE is_active = true
      `);
      
      // Recupera i premi come farebbe l'endpoint normale
      const result = await db.execute(`
        SELECT r.*, rg.position
        FROM flt_rewards r
        JOIN reward_games rg ON r.id = rg.reward_id
        WHERE rg.game_id = $1::uuid
          AND rg.leaderboard_type = $2
          AND r.is_active = true
        ORDER BY rg.position ASC
      `, [gameId, leaderboardType]);
      
      res.json({
        clientId: req.client.clientId,
        gameId,
        gameName: gameResult.rows[0].name,
        leaderboardType,
        associationsCount: associationsResult.rows.length,
        associations: associationsResult.rows,
        totalActiveRewards: allRewardsResult.rows.length,
        rewardsFromQuery: result.rows.length,
        rewardsDetail: result.rows.map((r: any) => ({ id: r.id, name: r.name, position: r.position }))
      });
    } catch (error) {
      console.error('[CLIENT DEBUG] Errore:', error);
      res.status(500).json({ 
        error: 'Errore durante la verifica',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
    }
  });
  
  // Endpoint di debug per verificare le associazioni tra giochi e premi
  app.get('/api/debug/reward-associations/:gameId', async (req, res) => {
    try {
      const { gameId } = req.params;
      const leaderboardType = req.query.leaderboardType as string || 'global';
      
      console.log(`[DEBUG] Verifica associazioni per gameId: ${gameId}, leaderboardType: ${leaderboardType}`);
      
      // Verifica le associazioni esistenti
      const associationsResult = await db.execute(`
        SELECT rg.*, r.name as reward_name
        FROM reward_games rg
        JOIN flt_rewards r ON rg.reward_id = r.id
        WHERE rg.game_id = $1::uuid
          AND rg.leaderboard_type = $2
        ORDER BY rg.position ASC
      `, [gameId, leaderboardType]);
      
      // Verifica tutti i premi attivi
      const allRewardsResult = await db.execute(`
        SELECT id, name FROM flt_rewards WHERE is_active = true
      `);
      
      res.json({
        message: `Trovate ${associationsResult.rows.length} associazioni per il gioco ${gameId}`,
        associations: associationsResult.rows,
        totalActiveRewards: allRewardsResult.rows.length,
        allActiveRewards: allRewardsResult.rows
      });
    } catch (error) {
      console.error('[DEBUG] Errore durante la verifica delle associazioni:', error);
      res.status(500).json({ error: 'Errore durante la verifica' });
    }
  });
  
  // Endpoint di debug SQL diretto per verificare i dati nel database
  app.get('/api/debug/sql/games/:gameId/rewards', async (req, res) => {
    try {
      const { gameId } = req.params;
      const leaderboardType = req.query.leaderboardType as string || 'global';
      
      console.log(`[DEBUG SQL] Verifica diretta SQL per gameId: ${gameId}, leaderboardType: ${leaderboardType}`);
      
      // Verifica che il gioco esista e sia attivo
      const gameDataResult = await db.execute(`
        SELECT id, name FROM flt_games WHERE id = $1 AND is_active = true
      `, [gameId]);
      
      if (gameDataResult.rows.length === 0) {
        return res.status(404).json({ error: 'Game not found or not active' });
      }
      
      const gameName = gameDataResult.rows[0].name;
      
      // Verifica i dati nella tabella flt_rewards
      const sampleRewardsResult = await db.execute(`
        SELECT id, name, description, type, value, image_url, points, icon, color, available, is_active
        FROM flt_rewards
        WHERE is_active = true
        LIMIT 5
      `);
      
      // Verifica le associazioni nella tabella reward_games
      const associationsResult = await db.execute(`
        SELECT id, game_id, reward_id, position, leaderboard_type
        FROM reward_games
        WHERE game_id = $1::uuid
          AND leaderboard_type = $2
        ORDER BY position ASC
      `, [gameId, leaderboardType]);
      
      console.log(`[DEBUG SQL] Trovate ${associationsResult.rows.length} associazioni per il gioco ${gameName}`);
      
      // Se non ci sono associazioni, restituisci un array vuoto
      if (associationsResult.rows.length === 0) {
        console.log(`[DEBUG SQL] Nessun premio trovato per il gioco ${gameId} con leaderboardType=${leaderboardType}`);
        return res.json([]);
      }
      
      // Estrai gli ID dei premi dalle associazioni
      const rewardIds = associationsResult.rows.map((row: { reward_id: string }) => row.reward_id);
      console.log(`[DEBUG SQL] ID dei premi da recuperare:`, rewardIds);
      
      // Seconda query: ottieni i dettagli dei premi
      const rewardsDetailResult = await db.execute(`
        SELECT id, name, description, image_url, points, type, value, icon, color, available, is_active
        FROM flt_rewards
        WHERE id = ANY($1::uuid[])
          AND is_active = true
      `, [rewardIds]);
      
      // Verifica diretta di un reward specifico
      let specificRewardId = null;
      if (associationsResult.rows.length > 0) {
        specificRewardId = associationsResult.rows[0].reward_id;
        console.log(`[DEBUG SQL] Verifica reward specifico con ID: ${specificRewardId}`);
      }
      
      const specificRewardResult = specificRewardId ? await db.execute(`
        SELECT * FROM flt_rewards WHERE id = $1
      `, [specificRewardId]) : { rows: [] };
      
      // Query SQL diretta per verificare i dati con JOIN
      const joinResult = await db.execute(`
        SELECT 
          rg.id as association_id, 
          rg.position, 
          rg.leaderboard_type,
          rg.game_id,
          rg.reward_id as association_reward_id,
          r.id as reward_id, 
          r.name, 
          r.description, 
          r.image_url, 
          r.points, 
          r.type, 
          r.value, 
          r.icon, 
          r.color,
          r.available,
          r.is_active
        FROM reward_games rg
        JOIN flt_rewards r ON rg.reward_id::text = r.id::text
        WHERE rg.game_id = $1
          AND rg.leaderboard_type = $2
          AND r.is_active = true
        ORDER BY rg.position ASC
      `, [gameId, leaderboardType]);
      
      res.json({
        query: {
          gameId,
          leaderboardType
        },
        sampleRewards: sampleRewardsResult.rows,
        associations: associationsResult.rows,
        specificRewardId,
        specificReward: specificRewardResult.rows[0] || null,
        joinResults: joinResult.rows,
        joinResultsCount: joinResult.rows.length
      });
    } catch (error) {
      console.error('[DEBUG SQL] Errore:', error);
      res.status(500).json({ error: 'Errore durante la verifica SQL' });
    }
  });
}
