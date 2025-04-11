import { Router } from 'express';
import * as feltrinelliApi from '../../../feltrinelli-api';
import { GAME_IDS } from '../../../feltrinelli-api';
import * as fltApi from '../../../flt-api';
import * as fltSimpleApi from '../../../flt-simple-api';
import * as userProfileApi from '../../../user-profile-api';
import { supabase } from '../../../supabase';
import { gamesController } from '../controllers/games-controller';

const router = Router();

// Sessione di gioco
router.post('/session', async (req, res) => {
  try {
    const { userId, gameType } = req.body;
    
    if (!userId || !gameType) {
      return res.status(400).json({ message: 'userId and gameType are required' });
    }
    
    if (!['books', 'authors', 'years'].includes(gameType)) {
      return res.status(400).json({ message: 'gameType must be one of: books, authors, years' });
    }
    
    // Verifichiamo che l'userId sia in formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ 
        message: 'userId deve essere in formato UUID (es. 00000000-0000-0000-0000-000000000099)' 
      });
    }
    
    const session = await feltrinelliApi.createGameSession(userId, gameType as 'books' | 'authors' | 'years');
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: `Error creating game session: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Domande Quiz Libri
router.get('/bookquiz/question', async (req, res) => {
  try {
    const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : 1;
    const question = await feltrinelliApi.getBookQuizQuestion(difficulty);
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: `Error fetching book quiz question: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Risposte Quiz Libri
router.post('/bookquiz/answer', async (req, res) => {
  try {
    const { sessionId, questionId, answerOptionId, timeTaken } = req.body;
    
    if (!sessionId || !questionId || !answerOptionId || timeTaken === undefined) {
      return res.status(400).json({ message: 'sessionId, questionId, answerOptionId, and timeTaken are required' });
    }
    
    const result = await feltrinelliApi.submitBookQuizAnswer(sessionId, questionId, answerOptionId, timeTaken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: `Error submitting book quiz answer: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Domande Quiz Autori
router.get('/authorquiz/question', async (req, res) => {
  try {
    const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : 1;
    const question = await feltrinelliApi.getAuthorQuizQuestion(difficulty);
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: `Error fetching author quiz question: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Risposte Quiz Autori
router.post('/authorquiz/answer', async (req, res) => {
  try {
    const { sessionId, questionId, answerOptionId, timeTaken } = req.body;
    
    if (!sessionId || !questionId || !answerOptionId || timeTaken === undefined) {
      return res.status(400).json({ message: 'sessionId, questionId, answerOptionId, and timeTaken are required' });
    }
    
    const result = await feltrinelliApi.submitAuthorQuizAnswer(sessionId, questionId, answerOptionId, timeTaken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: `Error submitting author quiz answer: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Domande Quiz Anni
router.get('/yearquiz/question', async (req, res) => {
  try {
    const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : 1;
    const question = await feltrinelliApi.getYearQuizQuestion(difficulty);
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: `Error fetching year quiz question: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Risposte Quiz Anni
router.post('/yearquiz/answer', async (req, res) => {
  try {
    const { sessionId, questionId, answerYear, timeTaken } = req.body;
    
    if (!sessionId || !questionId || answerYear === undefined || timeTaken === undefined) {
      return res.status(400).json({ message: 'sessionId, questionId, answerYear, and timeTaken are required' });
    }
    
    const result = await feltrinelliApi.submitYearQuizAnswer(sessionId, questionId, answerYear, timeTaken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: `Error submitting year quiz answer: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Endpoint per recuperare tutti i giochi disponibili
// Endpoint per recuperare tutti i giochi Feltrinelli con le loro impostazioni
router.get('/games', async (req, res) => {
  try {
    console.log('[FeltrinelliRouter] Fetching all games with settings');
    
    // Prima recuperiamo tutti i giochi
    const { data: games, error: gamesError } = await supabase
      .from('flt_games')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (gamesError) {
      console.error('[FeltrinelliRouter] Error fetching games:', gamesError);
      throw gamesError;
    }
    
    // Poi recuperiamo tutte le impostazioni dei giochi
    const { data: settings, error: settingsError } = await supabase
      .from('flt_game_settings')
      .select('*');
    
    if (settingsError) {
      console.error('[FeltrinelliRouter] Error fetching game settings:', settingsError);
      throw settingsError;
    }
    
    // Creiamo una mappa delle impostazioni per un accesso più veloce
    const settingsMap = settings.reduce((map, setting) => {
      map[setting.game_id] = setting;
      return map;
    }, {});
    
    // Combiniamo i giochi con le loro impostazioni
    const gamesWithSettings = games.map(game => {
      const gameSetting = settingsMap[game.id] || {};
      
      return {
        id: game.id,
        name: game.name,
        description: game.description,
        isActive: game.is_active,
        feltrinelliGameId: game.feltrinelli_id,
        timerDuration: gameSetting.timer_duration || 30,
        questionCount: gameSetting.question_count || 10,
        difficulty: gameSetting.difficulty || 1,
        weeklyLeaderboard: gameSetting.weekly_leaderboard || false,
        monthlyLeaderboard: gameSetting.monthly_leaderboard || false,
        gameType: gameSetting.game_type || 'books'
      };
    });
    
    console.log('[FeltrinelliRouter] Returning games with settings:', gamesWithSettings);
    res.json(gamesWithSettings);
  } catch (error) {
    console.error('[FeltrinelliRouter] Error in /games endpoint:', error);
    res.status(500).json({ 
      message: `Error fetching games: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Endpoint per recuperare un gioco specifico con le sue impostazioni
router.get('/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Utilizziamo direttamente la tabella flt_games invece di games
    const { data, error } = await supabase
      .from('flt_games')
      .select(`
        id,
        name,
        description,
        is_active,
        feltrinelli_id,
        flt_game_settings (
          timer_duration,
          question_count,
          difficulty,
          weekly_leaderboard,
          monthly_leaderboard,
          game_type
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`[FeltrinelliRouter] Error fetching game ${id}:`, error);
      throw error;
    }
    
    // Trasformiamo i dati per mantenere la compatibilità con il client
    const settings = data.flt_game_settings?.[0] || {};
    const formattedGame = {
      id: data.id,
      name: data.name,
      description: data.description,
      isActive: data.is_active,
      feltrinelliGameId: data.feltrinelli_id,
      timerDuration: settings.timer_duration || 30,
      questionCount: settings.question_count || 10,
      difficulty: settings.difficulty || 1,
      weeklyLeaderboard: settings.weekly_leaderboard || false,
      monthlyLeaderboard: settings.monthly_leaderboard || false,
      gameType: settings.game_type || 'books'
    };
    
    res.json(formattedGame);
  } catch (error) {
    res.status(500).json({ 
      message: `Error fetching game: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Endpoint per recuperare le impostazioni di un gioco
router.get('/game-settings/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    console.log(`[FeltrinelliRouter] Fetching settings for game ${gameId}`);
    
    // Otteniamo le impostazioni dalla tabella flt_game_settings usando l'ID del gioco
    const { data, error } = await supabase
      .from('flt_game_settings')
      .select('*')
      .eq('game_id', gameId)
      .single();
    
    if (error) {
      console.error(`[FeltrinelliRouter] Error fetching game settings:`, error);
      
      // Se non troviamo le impostazioni, proviamo a cercare il gioco
      const { data: gameData, error: gameError } = await supabase
        .from('flt_games')
        .select('*')
        .eq('id', gameId)
        .single();
      
      if (gameError) {
        console.error(`[FeltrinelliRouter] Error fetching game:`, gameError);
        throw gameError;
      }
      
      // Restituiamo le impostazioni predefinite
      const defaultSettings = {
        timerDuration: 30,
        questionCount: 10,
        difficulty: 1,
        isActive: true,
        weeklyLeaderboard: false,
        monthlyLeaderboard: false,
        gameType: 'books'
      };
      
      console.log(`[FeltrinelliRouter] Using default settings for game ${gameId}:`, defaultSettings);
      return res.json(defaultSettings);
    }
    
    // Trasformiamo i dati per mantenere la compatibilità con il client
    const formattedSettings = {
      timerDuration: data.timer_duration || 30,
      questionCount: data.question_count || 10,
      difficulty: data.difficulty || 1,
      isActive: data.is_active || true,
      weeklyLeaderboard: data.weekly_leaderboard || false,
      monthlyLeaderboard: data.monthly_leaderboard || false,
      gameType: data.game_type || 'books'
    };
    
    console.log(`[FeltrinelliRouter] Settings for game ${gameId}:`, formattedSettings);
    res.json(formattedSettings);
  } catch (error) {
    res.status(500).json({ 
      message: `Error fetching game settings: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Endpoint per recuperare tutti i premi
router.get('/rewards-all', fltSimpleApi.getAllFLTRewards);

// Endpoint per recuperare tutti i badges di un gioco
router.get('/games/:gameId/badges', fltSimpleApi.getGameBadges);

// Endpoint per recuperare tutti i badges disponibili
router.get('/badges', fltSimpleApi.getAllBadges);

// Endpoint per recuperare un badge specifico tramite ID
router.get('/badges/:id', fltSimpleApi.getFLTBadge);

// Endpoint per recuperare il profilo completo utente con rewards e badges
router.get('/user-profile/:userId', userProfileApi.getUserProfile);

// Endpoint per recuperare i badges dell'utente per un gioco specifico
router.get('/user-game-badges/:userId/:gameId', userProfileApi.getUserGameBadges);

// Endpoint per recuperare i rewards dell'utente per un gioco specifico
router.get('/user-game-rewards/:userId/:gameId', userProfileApi.getUserGameRewards);

// Aggiungi qui altri endpoint specifici per Feltrinelli...

// Aggiungi questo endpoint per ottenere gli ID dei giochi Feltrinelli
router.get('/game-ids', async (req, res) => {
  try {
    console.log('[FeltrinelliRouter] Fetching game IDs');
    
    // Restituisci gli ID predefiniti per i tipi di gioco
    const gameIds = {
      books: '123e4567-e89b-12d3-a456-426614174000',
      authors: '123e4567-e89b-12d3-a456-426614174001',
      years: '123e4567-e89b-12d3-a456-426614174002'
    };
    
    console.log('[FeltrinelliRouter] Game IDs:', gameIds);
    res.json(gameIds);
  } catch (error) {
    console.error('[FeltrinelliRouter] Error fetching game IDs:', error);
    res.status(500).json({ 
      message: `Error fetching game IDs: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Modifica questa route per aggiornare le impostazioni del gioco
router.put('/games/:id/settings', async (req, res) => {
  try {
    const { id } = req.params;
    const settings = req.body;
    
    console.log(`[FeltrinelliRouter] Updating settings for game ${id}:`, settings);
    
    // Prima otteniamo il gioco dalla tabella flt_games
    const { data: gameData, error: gameError } = await supabase
      .from('flt_games')
      .select('*')
      .eq('id', id)
      .single();
    
    if (gameError) {
      console.error(`[FeltrinelliRouter] Error fetching game data:`, gameError);
      throw gameError;
    }
    
    if (!gameData) {
      throw new Error(`Game with ID ${id} not found`);
    }
    
    console.log(`[FeltrinelliRouter] Found game:`, gameData);
    
    // Prima verifichiamo se esiste già un record per questo gioco
    const { data: existingSettings, error: existingError } = await supabase
      .from('flt_game_settings')
      .select('*')
      .eq('game_id', id)
      .maybeSingle();
    
    if (existingError) {
      console.error(`[FeltrinelliRouter] Error checking existing settings:`, existingError);
      throw existingError;
    }
    
    let settingsResult;
    
    if (existingSettings) {
      // Se esiste già un record, aggiorniamolo
      console.log(`[FeltrinelliRouter] Updating existing settings for game ${id}`);
      const { data, error } = await supabase
        .from('flt_game_settings')
        .update({
          timer_duration: settings.timer_duration,
          question_count: settings.question_count || 10,
          difficulty: settings.difficulty || 1,
          is_active: settings.is_active !== undefined ? settings.is_active : true,
          weekly_leaderboard: settings.weekly_leaderboard !== undefined ? settings.weekly_leaderboard : false,
          monthly_leaderboard: settings.monthly_leaderboard !== undefined ? settings.monthly_leaderboard : false,
          game_type: settings.game_type || null,
          updated_at: new Date()
        })
        .eq('game_id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`[FeltrinelliRouter] Error updating settings:`, error);
        throw error;
      }
      
      settingsResult = data;
    } else {
      // Se non esiste, creiamo un nuovo record
      console.log(`[FeltrinelliRouter] Creating new settings for game ${id}`);
      const { data, error } = await supabase
        .from('flt_game_settings')
        .insert({
          game_id: id,
          timer_duration: settings.timer_duration,
          question_count: settings.question_count || 10,
          difficulty: settings.difficulty || 1,
          is_active: settings.is_active !== undefined ? settings.is_active : true,
          weekly_leaderboard: settings.weekly_leaderboard !== undefined ? settings.weekly_leaderboard : false,
          monthly_leaderboard: settings.monthly_leaderboard !== undefined ? settings.monthly_leaderboard : false,
          game_type: settings.game_type || null,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();
      
      if (error) {
        console.error(`[FeltrinelliRouter] Error creating settings:`, error);
        throw error;
      }
      
      settingsResult = data;
    }
    
    // Aggiorna anche il record nella tabella flt_games
    try {
      interface UpdateData {
        is_active: boolean;
        updated_at: Date;
        feltrinelli_id?: string;
        name?: string;
        description?: string;
      }
      
      const updateData: UpdateData = {
        is_active: settings.is_active !== undefined ? settings.is_active : true,
        updated_at: new Date()
      };
      
      // Aggiorna feltrinelli_id solo se fornito e diverso da null
      if (settings.feltrinelli_id) {
        updateData.feltrinelli_id = settings.feltrinelli_id;
      }
      
      // Aggiorna name e description se forniti
      if (settings.name) {
        updateData.name = settings.name;
        console.log(`[FeltrinelliRouter] Updating game name to: ${settings.name}`);
      } else {
        console.log(`[FeltrinelliRouter] Name not provided in request`);
      }
      
      if (settings.description) {
        updateData.description = settings.description;
        console.log(`[FeltrinelliRouter] Updating game description to: ${settings.description}`);
      } else {
        console.log(`[FeltrinelliRouter] Description not provided in request`);
      }
      
      console.log(`[FeltrinelliRouter] Final update data for flt_games:`, updateData);
      
      const { data: updatedGameData, error: gameUpdateError } = await supabase
        .from('flt_games')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (gameUpdateError) {
        console.warn(`[FeltrinelliRouter] Warning: Could not update flt_games record: ${gameUpdateError.message}`);
      } else {
        console.log(`[FeltrinelliRouter] Successfully updated flt_games record:`, updatedGameData);
      }
    } catch (gameUpdateError) {
      console.warn(`[FeltrinelliRouter] Warning: Error updating flt_games record: ${gameUpdateError instanceof Error ? gameUpdateError.message : 'Unknown error'}`);
    }
    
    console.log(`[FeltrinelliRouter] Settings updated successfully:`, settingsResult);
    
    // Formatta la risposta per il client in modo coerente con gli altri endpoint
    const formattedResponse = {
      timerDuration: settingsResult.timer_duration,
      questionCount: settingsResult.question_count || 10,
      difficulty: settingsResult.difficulty || 1,
      isActive: settingsResult.is_active || true,
      weeklyLeaderboard: settingsResult.weekly_leaderboard || false,
      monthlyLeaderboard: settingsResult.monthly_leaderboard || false,
      gameType: settingsResult.game_type || 'books',
      id: id,
      feltrinelliGameId: gameData.feltrinelli_id,
      // Includi name e description dalla tabella flt_games
      name: settings.name || gameData.name,
      description: settings.description || gameData.description
    };
    
    console.log(`[FeltrinelliRouter] Formatted response:`, formattedResponse);
    res.json(formattedResponse);
  } catch (error) {
    console.error('[FeltrinelliRouter] Error updating game settings:', error);
    res.status(500).json({ 
      message: `Error updating game settings: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

export default router;