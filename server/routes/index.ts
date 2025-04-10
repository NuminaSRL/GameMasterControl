import { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../storage.js";
import { insertGameSchema, insertBadgeSchema, insertRewardSchema, insertGameBadgeSchema } from "../validators";
import * as feltrinelliApi from "../feltrinelli-api";
import { GAME_IDS } from "../feltrinelli-api";
import * as fltApi from "../flt-api";
import * as fltSimpleApi from "../flt-simple-api";
import * as userProfileApi from "../user-profile-api";
import { supabase, safeSupabaseQuery } from '../supabase';
import crypto from 'crypto';
import feltrinelliRouter from '../clients/feltrinelli/routes/feltrinelli-routes';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Aggiungi questo codice per definire __dirname in un modulo ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verifica se il file .env esiste e lo carica
const envPath = path.resolve(__dirname, '../.env');// Aggiornato per riflettere la posizione corretta
if (fs.existsSync(envPath)) {
  console.log('[Config] Caricamento variabili d\'ambiente da .env');
  dotenv.config({ path: envPath });
} else {
  console.warn('[Config] File .env non trovato');
}

// Log delle variabili d'ambiente per verifica
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Presente' : 'Assente');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Presente' : 'Assente');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Presente' : 'Assente');



export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // === FELTRINELLI API INTEGRATION - NUOVA VERSIONE ===

    // Registra le route di Feltrinelli con il nuovo percorso
    app.use('/api/clients/feltrinelli', feltrinelliRouter);
  
    // Mantieni anche il vecchio percorso per retrocompatibilità
    app.use('/api/feltrinelli', feltrinelliRouter);
  
  // Health check principale
  app.get('/api/health', (req, res) => {
    console.log('[Health Check] Endpoint chiamato - risposta immediata senza dipendenze');
    
    try {
      // Log per tracciare il percorso di esecuzione
      console.log('[Health Check] Inizio elaborazione');
      
      // Verifichiamo le variabili d'ambiente critiche
      console.log('[Health Check] Verifica variabili ambiente:', {
        SUPABASE_URL: process.env.SUPABASE_URL ? 'Presente' : 'Assente',
        DATABASE_URL: process.env.DATABASE_URL ? 'Presente' : 'Assente'
      });
      
      // Rispondiamo immediatamente con 200 OK senza alcuna logica o dipendenza
      console.log('[Health Check] Invio risposta 200 OK');
      return res.status(200).send('OK');
    } catch (error) {
      // Log dell'errore se qualcosa va storto
      console.error('[Health Check] Errore:', error);
      return res.status(500).send('Health check error');
    }
  });



  // Sessione di gioco - sia con /api/games/session che con /api/feltrinelli/session
  app.post('/api/games/session', async (req, res) => {
    try {
      const { user_id, game_id } = req.body;
      
      if (!user_id) {
        return res.status(400).json({ message: 'user_id is required' });
      }
      
      // Verifichiamo che l'user_id sia in formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(user_id)) {
        return res.status(400).json({ 
          message: 'user_id deve essere in formato UUID (es. 00000000-0000-0000-0000-000000000099)' 
        });
      }
      
      // Determiniamo il tipo di gioco dal game_id
      let gameType: 'books' | 'authors' | 'years' = 'books'; // default
      
      if (game_id === GAME_IDS.AUTHOR_QUIZ) {
        gameType = 'authors';
      } else if (game_id === GAME_IDS.YEAR_QUIZ) {
        gameType = 'years';
      }
      
      const session = await feltrinelliApi.createGameSession(user_id, gameType);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: `Error creating game session: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Versione feltrinelli della creazione sessione
  app.post('/api/feltrinelli/session', async (req, res) => {
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

  // Domande Quiz Libri (sia /api/games/bookquiz/question che /api/feltrinelli/bookquiz/question)
  app.get('/api/games/bookquiz/question', async (req, res) => {
    try {
      const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : 1;
      const question = await feltrinelliApi.getBookQuizQuestion(difficulty);
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: `Error fetching book quiz question: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  app.get('/api/feltrinelli/bookquiz/question', async (req, res) => {
    try {
      const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : 1;
      const question = await feltrinelliApi.getBookQuizQuestion(difficulty);
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: `Error fetching book quiz question: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Risposte Quiz Libri (sia /api/games/bookquiz/answer che /api/feltrinelli/bookquiz/answer)
  app.post('/api/games/bookquiz/answer', async (req, res) => {
    try {
      const { session_id, question_id, answer_option_id, time_taken } = req.body;
      
      if (!session_id || !question_id || !answer_option_id || time_taken === undefined) {
        return res.status(400).json({ message: 'session_id, question_id, answer_option_id, and time_taken are required' });
      }
      
      const result = await feltrinelliApi.submitBookQuizAnswer(session_id, question_id, answer_option_id, time_taken);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: `Error submitting book quiz answer: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  app.post('/api/feltrinelli/bookquiz/answer', async (req, res) => {
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
  app.get('/api/feltrinelli/authorquiz/question', async (req, res) => {
    try {
      const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : 1;
      const question = await feltrinelliApi.getAuthorQuizQuestion(difficulty);
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: `Error fetching author quiz question: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Risposte Quiz Autori
  app.post('/api/feltrinelli/authorquiz/answer', async (req, res) => {
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
  app.get('/api/feltrinelli/yearquiz/question', async (req, res) => {
    try {
      const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : 1;
      const question = await feltrinelliApi.getYearQuizQuestion(difficulty);
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: `Error fetching year quiz question: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Risposte Quiz Anni
  app.post('/api/feltrinelli/yearquiz/answer', async (req, res) => {
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

  // Classifica
  app.get('/api/feltrinelli/leaderboard', async (req, res) => {
    try {
      const period = (req.query.period as 'all_time' | 'monthly' | 'weekly') || 'all_time';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const leaderboard = await feltrinelliApi.getLeaderboard(period, limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: `Error fetching leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Classifica per gioco specifico
  app.get('/api/feltrinelli/leaderboard/:gameType', async (req, res) => {
    try {
      const gameType = req.params.gameType as 'books' | 'authors' | 'years';
      const period = (req.query.period as 'all_time' | 'monthly' | 'weekly') || 'all_time';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!['books', 'authors', 'years'].includes(gameType)) {
        return res.status(400).json({ message: 'gameType must be one of: books, authors, years' });
      }
      
      const gameId = feltrinelliApi.getGameIdByType(gameType);
      const leaderboard = await feltrinelliApi.getGameLeaderboard(gameId, period, limit);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: `Error fetching game leaderboard: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Invio punteggio
  app.post('/api/feltrinelli/score', async (req, res) => {
    try {
      const { userId, gameType, correctAnswers, totalQuestions, sessionId } = req.body;
      
      if (!userId || !gameType || correctAnswers === undefined || totalQuestions === undefined || !sessionId) {
        return res.status(400).json({ message: 'userId, gameType, correctAnswers, totalQuestions, and sessionId are required' });
      }
      
      if (!['books', 'authors', 'years'].includes(gameType)) {
        return res.status(400).json({ message: 'gameType must be one of: books, authors, years' });
      }
      
      const gameId = feltrinelliApi.getGameIdByType(gameType as 'books' | 'authors' | 'years');
      const result = await feltrinelliApi.submitScore(userId, gameId, correctAnswers, totalQuestions, sessionId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: `Error submitting score: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Premi disponibili
  app.get('/api/feltrinelli/rewards', async (req, res) => {
    try {
      const gameType = req.query.gameType as 'books' | 'authors' | 'years';
      const period = (req.query.period as 'all_time' | 'monthly' | 'weekly') || 'all_time';
      
      if (!gameType || !['books', 'authors', 'years'].includes(gameType)) {
        return res.status(400).json({ message: 'gameType query parameter is required and must be one of: books, authors, years' });
      }
      
      const gameId = feltrinelliApi.getGameIdByType(gameType);
      const rewards = await feltrinelliApi.getAvailableRewards(gameId, period);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: `Error fetching rewards: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Premi dell'utente
  app.get('/api/feltrinelli/rewards/user/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        return res.status(400).json({ message: 'userId is required' });
      }
      
      const rewards = await feltrinelliApi.getUserRewards(userId);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: `Error fetching user rewards: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // === NUOVI ENDPOINT PER FELTRINELLI - GESTIONE GAMES, SETTINGS E BADGES ===
  
  // Ottieni tutti i giochi Feltrinelli
  app.get('/api/feltrinelli/games', fltSimpleApi.getAllFLTGames);
  
  // Ottieni un gioco Feltrinelli specifico con le sue impostazioni
  app.get('/api/feltrinelli/games/:id', fltSimpleApi.getFLTGame);
  
  // Ottieni le impostazioni di un gioco
  app.get('/api/feltrinelli/game-settings/:gameId', fltSimpleApi.getGameSettings);
  
  // Ottieni tutti i premi Feltrinelli
  app.get('/api/feltrinelli/rewards-all', fltSimpleApi.getAllFLTRewards);
  
  // Ottieni tutti i badges di un gioco
  app.get('/api/feltrinelli/games/:gameId/badges', fltSimpleApi.getGameBadges);
  
  // Ottieni tutti i badges disponibili
  app.get('/api/feltrinelli/badges', fltSimpleApi.getAllBadges);
  
  // Ottieni un badge specifico tramite ID
  app.get('/api/feltrinelli/badges/:id', fltSimpleApi.getFLTBadge);
  
  // === NUOVI ENDPOINT PER PROFILI UTENTE CON REWARDS E BADGES ===
  
  // Ottieni profilo completo utente con rewards e badges
  app.get('/api/feltrinelli/user-profile/:userId', userProfileApi.getUserProfile);
  
  // Ottieni badges dell'utente per un gioco specifico
  app.get('/api/feltrinelli/user-game-badges/:userId/:gameId', userProfileApi.getUserGameBadges);
  
  // Ottieni rewards dell'utente per un gioco specifico
  app.get('/api/feltrinelli/user-game-rewards/:userId/:gameId', userProfileApi.getUserGameRewards);
  
  // Ottieni la classifica (leaderboard) da Feltrinelli API
  app.get('/api/feltrinelli/leaderboard-data', async (req, res) => {
    try {
      const { gameId, period = 'all_time', limit = 10 } = req.query;
      
      if (!gameId) {
        return res.status(400).json({ message: 'gameId query parameter is required' });
      }
      
      // Utilizziamo l'API di Feltrinelli per recuperare la classifica
      const validPeriod = ['all_time', 'monthly', 'weekly'].includes(period as string) 
        ? (period as 'all_time' | 'monthly' | 'weekly') 
        : 'all_time';
      
      try {
        // Recupera la classifica per il gioco specifico
        const leaderboardEntries = await feltrinelliApi.getGameLeaderboard(
          gameId as string,
          validPeriod,
          Number(limit)
        );
        
        res.json({ data: leaderboardEntries });
      } catch (fetchError) {
        console.error('Error fetching leaderboard from Feltrinelli API:', fetchError);
        // In caso di errore con l'API esterna, restituiamo un array vuoto
        res.json({ data: [] });
      }
    } catch (error) {
      console.error('Error in leaderboard endpoint:', error);
      // Per evitare errori 500 al client, restituiamo un array vuoto
      res.json({ data: [] });
    }
  });
  
  // Sincronizza premi da Feltrinelli al database locale
  app.post('/api/feltrinelli/rewards/sync', async (req, res) => {
    try {
      const { gameType, period = 'all_time' } = req.body;
      
      if (!gameType || !['books', 'authors', 'years'].includes(gameType)) {
        return res.status(400).json({ 
          message: 'gameType is required and must be one of: books, authors, years' 
        });
      }
      
      // 1. Ottieni i premi da Feltrinelli
      const gameId = feltrinelliApi.getGameIdByType(gameType);
      const feltrinelliRewards = await feltrinelliApi.getAvailableRewards(gameId, period);
      
      // 2. Prepara il contatore dei risultati
      const syncResults: {
        totalFetched: number;
        added: number;
        updated: number;
        failed: number;
        details: Array<{
          id?: number;
          name: string;
          action: string;
          error?: string;
        }>;
      } = {
        totalFetched: feltrinelliRewards.length,
        added: 0,
        updated: 0,
        failed: 0,
        details: []
      };
      
      // 3. Sincronizza ogni premio
      for (const reward of feltrinelliRewards) {
        try {
          // Verifica se esiste già un premio con questo ID Feltrinelli
          const existingRewards = await storage.getAllRewards();
          const existingReward = existingRewards.find(r => r.feltrinelliRewardId === reward.id);
          
          const rewardData = {
            name: reward.name,
            description: reward.description,
            type: 'feltrinelli',
            value: `Posizione ${reward.rank}`,
            rank: reward.rank,
            pointsRequired: reward.points_required,
            icon: reward.rank <= 3 ? 'trophy' : 'award',
            color: reward.rank === 1 ? '#FFD700' : reward.rank === 2 ? '#C0C0C0' : reward.rank === 3 ? '#CD7F32' : '#3B82F6',
            available: 1,
            gameType: gameType,
            feltrinelliRewardId: reward.id,
            originalImageUrl: reward.image_url,
            isImported: true,
            syncedAt: new Date()
          };
          
          if (existingReward) {
            // Aggiorna il premio esistente
            await storage.updateReward(existingReward.id, rewardData);
            syncResults.updated++;
            syncResults.details.push({ id: existingReward.id, name: reward.name, action: 'updated' });
          } else {
            // Crea un nuovo premio
            const newReward = await storage.createReward(rewardData as any);
            syncResults.added++;
            syncResults.details.push({ id: newReward.id, name: reward.name, action: 'added' });
          }
        } catch (error) {
          syncResults.failed++;
          syncResults.details.push({ 
            name: reward.name, 
            action: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      res.json({
        success: true,
        results: syncResults
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: `Error syncing rewards: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  });

  // === GAMES ENDPOINTS ===
  
  // Get all games
  app.get('/api/games', async (req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: `Error fetching games: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Get a specific game
  app.get('/api/games/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const game = await storage.getGame(id);
      
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: `Error fetching game: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Create a new game
  app.post('/api/games', async (req, res) => {
    try {
      const validatedData = insertGameSchema.parse(req.body);
      const newGame = await storage.createGame(validatedData);
      res.status(201).json(newGame);
    } catch (error) {
      res.status(400).json({ message: `Error creating game: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Update a game
  app.patch('/api/games/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertGameSchema.partial().parse(req.body);
      
      const updatedGame = await storage.updateGame(id, validatedData);
      
      if (!updatedGame) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      res.json(updatedGame);
    } catch (error) {
      res.status(400).json({ message: `Error updating game: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Toggle game status
  app.post('/api/games/:id/toggle', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedGame = await storage.toggleGameStatus(id);
      
      if (!updatedGame) {
        return res.status(404).json({ message: 'Game not found' });
      }
      
      res.json(updatedGame);
    } catch (error) {
      res.status(500).json({ message: `Error toggling game status: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // === BADGES ENDPOINTS ===
  
  // Get all badges
  app.get('/api/badges', async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: `Error fetching badges: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Create a new badge
  app.post('/api/badges', async (req, res) => {
    try {
      const validatedData = insertBadgeSchema.parse(req.body);
      const newBadge = await storage.createBadge(validatedData);
      res.status(201).json(newBadge);
    } catch (error) {
      res.status(400).json({ message: `Error creating badge: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Get badges for a specific game
  app.get('/api/games/:id/badges', async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      const badges = await storage.getGameBadges(gameId);
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: `Error fetching badges for game: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Assign badge to game
  app.post('/api/games/:gameId/badges/:badgeId', async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const badgeId = parseInt(req.params.badgeId);
      
      const validatedData = insertGameBadgeSchema.parse({ gameId, badgeId });
      const gameBadge = await storage.assignBadgeToGame(validatedData);
      res.status(201).json(gameBadge);
    } catch (error) {
      res.status(400).json({ message: `Error assigning badge to game: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Remove badge from game
  app.delete('/api/games/:gameId/badges/:badgeId', async (req, res) => {
    try {
      const gameId = parseInt(req.params.gameId);
      const badgeId = parseInt(req.params.badgeId);
      
      await storage.removeBadgeFromGame(gameId, badgeId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: `Error removing badge from game: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // === REWARDS ENDPOINTS ===
  
  // Get all rewards
  app.get('/api/rewards', async (req, res) => {
    try {
      const rewards = await storage.getAllRewards();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: `Error fetching rewards: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Create a new reward
  app.post('/api/rewards', async (req, res) => {
    try {
      const validatedData = insertRewardSchema.parse(req.body);
      const newReward = await storage.createReward(validatedData);
      res.status(201).json(newReward);
    } catch (error) {
      res.status(400).json({ message: `Error creating reward: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Get a reward by ID
  app.get('/api/rewards/:id', async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const reward = await storage.getReward(rewardId);
      if (!reward) {
        return res.status(404).json({ message: 'Reward not found' });
      }
      res.json(reward);
    } catch (error) {
      res.status(500).json({ message: `Error fetching reward: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Update a reward
  app.patch('/api/rewards/:id', async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const reward = await storage.getReward(rewardId);
      if (!reward) {
        return res.status(404).json({ message: 'Reward not found' });
      }
      
      const validatedData = insertRewardSchema.partial().parse(req.body);
      const updatedReward = await storage.updateReward(rewardId, validatedData);
      res.json(updatedReward);
    } catch (error) {
      res.status(400).json({ message: `Error updating reward: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Delete a reward
  app.delete('/api/rewards/:id', async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const reward = await storage.getReward(rewardId);
      if (!reward) {
        return res.status(404).json({ message: 'Reward not found' });
      }
      
      await storage.deleteReward(rewardId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: `Error deleting reward: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // === STATS ENDPOINTS ===
  
  // Get dashboard stats
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: `Error fetching stats: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });
  
  // Update dashboard stats
  app.put('/api/stats', async (req, res) => {
    try {
      const statsUpdate = req.body;
      const updatedStats = await storage.updateStats(statsUpdate);
      res.json(updatedStats);
    } catch (error) {
      res.status(500).json({ message: `Error updating stats: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // === FLT API - ESPOSIZIONE DEL NOSTRO SISTEMA COME API ===

  // Health check
  app.get('/api/v1/health', (req, res) => fltApi.healthCheck(req, res));
  app.get('/api/v1/health-check', (req, res) => fltApi.healthCheck(req, res));

  // Gestione sessioni
  app.post('/api/v1/games/session', (req, res) => fltApi.createGameSession(req, res));

  // Quiz libri
  app.get('/api/v1/games/bookquiz/question', (req, res) => fltApi.getBookQuizQuestion(req, res));
  app.post('/api/v1/games/bookquiz/answer', (req, res) => fltApi.submitBookQuizAnswer(req, res));



  // Rewards
  app.get('/api/v1/rewards/available', (req, res) => fltApi.getAvailableRewards(req, res));
  app.get('/api/v1/rewards/user/:userId', (req, res) => fltApi.getUserRewards(req, res));

  // Importazione profili utente
  app.post('/api/v1/profile/import', (req, res) => fltApi.importFeltrinelliUserProfile(req, res));

  // Inizializzazione delle tabelle FLT al riavvio del server
 /* fltApi.initFeltrinelliTables().catch(error => {
    console.error('Errore durante inizializzazione tabelle Feltrinelli:', error);
  });*/

  // === BACKOFFICE API PER FELTRINELLI MAPPING ===

  // Ottieni tutti i giochi mappati
  app.get('/api/feltrinelli-mapping/games', async (req, res) => {
    try {
      const { data } = await supabase
        .from('flt_games')
        .select('*')
        .order('internal_id', { ascending: true });

      const formattedGames = data?.map(game => ({
        id: game.id,
        feltrinelliId: game.feltrinelli_id,
        internalId: game.internal_id,
        name: game.name,
        description: game.description,
        isActive: game.is_active
      }));

      res.json(formattedGames || []);
    } catch (error) {
      console.error('Error fetching Feltrinelli game mappings:', error);
      res.status(500).json({ error: 'Failed to fetch Feltrinelli game mappings' });
    }
  });

  // Ottieni un gioco mappato specifico
  app.get('/api/feltrinelli-mapping/games/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('flt_games')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Game mapping not found' });
      }

      const formattedGame = {
        id: data.id,
        feltrinelliId: data.feltrinelli_id,
        internalId: data.internal_id,
        name: data.name,
        description: data.description,
        isActive: data.is_active
      };

      res.json(formattedGame);
    } catch (error) {
      console.error('Error fetching Feltrinelli game mapping:', error);
      res.status(500).json({ error: 'Failed to fetch Feltrinelli game mapping' });
    }
  });

  // Crea un nuovo mapping di gioco
  app.post('/api/feltrinelli-mapping/games', async (req, res) => {
    try {
      const { feltrinelliId, internalId } = req.body;

      if (!feltrinelliId || !internalId) {
        return res.status(400).json({ error: 'feltrinelliId and internalId are required' });
      }

      // Verifica se esiste già un mapping con questo feltrinelliId
      const { data: existingMapping } = await supabase
        .from('flt_games')
        .select('*')
        .eq('feltrinelli_id', feltrinelliId)
        .single();

      if (existingMapping) {
        return res.status(409).json({ error: 'A mapping with this Feltrinelli ID already exists' });
      }

      // Ottieni il gioco interno
      const internalGame = await storage.getGame(internalId);
      if (!internalGame) {
        return res.status(404).json({ error: 'Internal game not found' });
      }

      // Crea il nuovo mapping
      const { data, error } = await supabase
        .from('flt_games')
        .insert([{
          id: crypto.randomUUID(),
          feltrinelli_id: feltrinelliId,
          internal_id: internalId,
          name: internalGame.name,
          description: internalGame.description,
          is_active: internalGame.isActive
        }])
        .select();

      if (error) {
        throw new Error(`Failed to create game mapping: ${error.message}`);
      }

      const newMapping = {
        id: data[0].id,
        feltrinelliId: data[0].feltrinelli_id,
        internalId: data[0].internal_id,
        name: data[0].name,
        description: data[0].description,
        isActive: data[0].is_active
      };

      res.status(201).json(newMapping);
    } catch (error) {
      console.error('Error creating Feltrinelli game mapping:', error);
      res.status(500).json({ error: 'Failed to create Feltrinelli game mapping' });
    }
  });

  // Togglea lo stato attivo di un gioco mappato
  app.post('/api/feltrinelli-mapping/games/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;

      // Ottieni il mapping corrente
      const { data: currentMapping, error: fetchError } = await supabase
        .from('flt_games')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(404).json({ error: 'Game mapping not found' });
      }

      // Aggiorna lo stato
      const newActiveState = !currentMapping.is_active;

      const { data, error } = await supabase
        .from('flt_games')
        .update({ is_active: newActiveState, updated_at: new Date() })
        .eq('id', id)
        .select();

      if (error) {
        throw new Error(`Failed to update game mapping: ${error.message}`);
      }

      const updatedMapping = {
        id: data[0].id,
        feltrinelliId: data[0].feltrinelli_id,
        internalId: data[0].internal_id,
        name: data[0].name,
        description: data[0].description,
        isActive: data[0].is_active
      };

      res.json(updatedMapping);
    } catch (error) {
      console.error('Error updating Feltrinelli game mapping:', error);
      res.status(500).json({ error: 'Failed to update Feltrinelli game mapping' });
    }
  });

  // Ottieni tutti i profili utente
  app.get('/api/feltrinelli-mapping/user-profiles', async (req, res) => {
    try {
      // Using direct supabase query as in your original code
      const { data, error } = await supabase
        .from('flt_user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching Feltrinelli user profiles:', error);
        return res.status(500).json({ error: 'Failed to fetch Feltrinelli user profiles' });
      }

      const formattedProfiles = data?.map(profile => ({
        id: profile.id,
        userId: profile.user_id,
        internalUserId: profile.internal_user_id,
        username: profile.username,
        email: profile.email,
        avatarUrl: profile.avatar_url
      }));

      res.json(formattedProfiles || []);
    } catch (error) {
      console.error('Error fetching Feltrinelli user profiles:', error);
      res.status(500).json({ error: 'Failed to fetch Feltrinelli user profiles' });
    }
  });

  // ===== NUOVE API PER TABELLE SEMPLIFICATE =====
  
  // API per FLT_users
  app.get('/api/flt/users', fltSimpleApi.getAllFLTUsers);
  app.get('/api/flt/users/:id', fltSimpleApi.getFLTUser);
  app.post('/api/flt/users', fltSimpleApi.createFLTUser);
  
  // API per FLT_games
  app.get('/api/flt/games', fltSimpleApi.getAllFLTGames);
  app.get('/api/flt/games/:id', fltSimpleApi.getFLTGame);
  app.post('/api/flt/games', fltSimpleApi.createFLTGame);
  app.patch('/api/flt/games/:id', fltSimpleApi.updateFLTGame);
  app.post('/api/flt/games/:id/toggle', fltSimpleApi.toggleFLTGameStatus);
  
  // API per tabella flt_game_settings
  app.get('/api/flt/game-settings/:gameId', fltSimpleApi.getGameSettings);
  app.post('/api/flt/game-settings/:gameId', fltSimpleApi.saveGameSettings);
  
  // API per FLT_rewards
  app.get('/api/flt/rewards', fltSimpleApi.getAllFLTRewards);
  app.get('/api/flt/rewards/game/:gameId', fltSimpleApi.getGameFLTRewards);
  app.get('/api/flt/rewards/:id', fltSimpleApi.getFLTReward);
  app.post('/api/flt/rewards', fltSimpleApi.createFLTReward);
  app.patch('/api/flt/rewards/:id', fltSimpleApi.updateFLTReward);
  app.post('/api/flt/rewards/:id/toggle', fltSimpleApi.toggleFLTRewardStatus);
  
  // NUOVI ENDPOINT RICHIESTI: /api/health, /api/health-check, /api/feltrinelli/health
  if (!app._router || !app._router.stack || !app._router.stack.some((r: any) => r.route && r.route.path === '/api/health-check')) {
    app.get('/api/health-check', async (req, res) => {
      try {
        const { data, error } = await supabase
          .from('flt_games')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          return res.status(503).json({ status: 'error', message: 'Database connection failed' });
        }
        
        res.json({ status: 'ok', message: 'Gaming Engine API is running' });
      } catch (error) {
        res.status(500).json({ status: 'error', message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` });
      }
    });
  }
  
  // === Endpoint specifici per l'integrazione con Feltrinelli ===
  
  // Endpoint health check
  if (!app._router || !app._router.stack || !app._router.stack.some((r: any) => r.route && r.route.path === '/api/health-check')) {
    app.get('/api/health-check', async (req, res) => {
      try {
        // Verifichiamo la connessione al database
        const { count, error } = await supabase
          .from('flt_games')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          return res.status(503).json({ status: 'error', message: 'Database connection failed' });
        }
        
        // Controlliamo anche l'accessibilità dell'API Feltrinelli se configurata
        const feltrinelliApiCheck = await feltrinelliApi.healthCheck().catch(() => false);
      
        res.json({ 
          status: 'ok', 
          message: 'Feltrinelli Gaming Engine API is running',
          database_connection: 'ok',
          feltrinelli_api_status: feltrinelliApiCheck ? 'connected' : 'not connected'
        });
      } catch (error) {
        res.status(500).json({ status: 'error', message: `Error in health check: ${error instanceof Error ? error.message : 'Unknown error'}` });
      }
    });
  }
  
  // Endpoint per recuperare tutti i giochi disponibili
  if (!app._router || !app._router.stack || !app._router.stack.some((r: any) => r.route && r.route.path === '/api/feltrinelli/games')) {
    app.get('/api/feltrinelli/games', async (req, res) => {
      try {
        // Recuperiamo solo i giochi attivi
        const { data, error } = await supabase
          .from('flt_games')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        const formattedGames = data?.map(game => ({
          id: game.feltrinelli_id,
          name: game.name,
          description: game.description,
          is_active: game.is_active,
          created_at: game.created_at
        })) || [];
        
        res.json(formattedGames);
      } catch (error) {
        console.error("Error getting active games:", error);
        res.status(500).json({ error: "Failed to get active games" });
      }
    });
  }
  
  // Endpoint per recuperare tutti gli ID dei giochi come array
  if (!app._router || !app._router.stack || !app._router.stack.some((r: any) => r.route && r.route.path === '/api/feltrinelli/game-ids')) {
    app.get('/api/feltrinelli/game-ids', async (req, res) => {
      try {
        // Use supabase instead of db.execute with sql
        const { data, error } = await supabase
          .from('flt_games')
          .select('feltrinelli_id, name, is_active')
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        const formattedGames = data ? data.map(game => ({
          id: game.feltrinelli_id,
          name: game.name,
          active: game.is_active
        })) : [];
        
        res.json(formattedGames);
      } catch (error) {
        console.error("Error getting game IDs:", error);
        // Fallback di emergenza - ritorniamo dati statici per garantire la compatibilità
        res.json([
          { id: "00000000-0000-0000-0000-000000000001", name: "IndovinaLibro", active: true },
          { id: "00000000-0000-0000-0000-000000000002", name: "Indovina l'Autore", active: true },
          { id: "00000000-0000-0000-0000-000000000003", name: "Indovina l'Anno", active: true }
        ]);
      }
    });
  }
  
  // Endpoint che restituisce gli ID dei giochi come oggetto (compatibilità)
  if (!app._router || !app._router.stack || !app._router.stack.some((r: any) => r.route && r.route.path === '/api/feltrinelli/game-ids-v1')) {
    app.get('/api/feltrinelli/game-ids-v1', async (req, res) => {
      try {
        // Questo formato è usato dalla versione originale dell'API e deve restare così
        // È una mappa fissa che mappa i tipi di gioco ai loro UUID corrispondenti
        const gameIdsMap: Record<string, string> = {
          books: "00000000-0000-0000-0000-000000000001",
          authors: "00000000-0000-0000-0000-000000000002",
          years: "00000000-0000-0000-0000-000000000003"
        };
        
        res.json(gameIdsMap);
      } catch (error) {
        console.error("Error getting game IDs map:", error);
        res.status(500).json({ error: "Failed to get game IDs map" });
      }
    });
  }
  
  // Endpoint per recuperare tutti i premi disponibili
  if (!app._router || !app._router.stack || !app._router.stack.some((r: any) => r.route && r.route.path === '/api/feltrinelli/rewards')) {
    app.get('/api/feltrinelli/rewards', async (req, res) => {
      try {
        const { data, error } = await supabase
          .from('flt_rewards')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const rewards = data?.map(reward => ({
          id: reward.id,
          name: reward.name,
          description: reward.description,
          type: reward.type,
          value: reward.value,
          icon: reward.icon,
          color: reward.color,
          available: reward.available,
          image_url: reward.image_url || null,
          start_date: reward.start_date || null,
          end_date: reward.end_date || null,
          created_at: reward.created_at
        })) || [];
        
        res.json({ success: true, rewards });
      } catch (error) {
        console.error("Error getting rewards:", error);
        res.status(500).json({ error: "Failed to get rewards" });
      }
    });
  }
  
  // Endpoint per recuperare i premi di un utente specifico
  if (!app._router || !app._router.stack || !app._router.stack.some((r: any) => r.route && r.route.path === '/api/feltrinelli/rewards/user/:userId')) {
    app.get('/api/feltrinelli/rewards/user/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        
        if (!userId) {
          return res.status(400).json({ error: "User ID is required" });
        }
        
        // Recupera i premi assegnati a questo utente
        const { data, error } = await supabase
          .from('flt_user_rewards')
          .select(`
            *,
            flt_rewards (*)
          `)
          .eq('user_id', userId);
        
        if (error) throw error;
        
        // Formatta i risultati
        const userRewards = data?.map(record => {
          // Verifichiamo che record.flt_rewards esista
          if (!record.flt_rewards) {
            console.warn(`Premio mancante per il record: ${JSON.stringify(record)}`);
            return null;
          }
          
          return {
            id: record.flt_rewards.id,
            name: record.flt_rewards.name,
            description: record.flt_rewards.description,
            type: record.flt_rewards.type,
            value: record.flt_rewards.value,
            icon: record.flt_rewards.icon,
            color: record.flt_rewards.color,
            image_url: record.flt_rewards.image_url || null,
            awarded_at: record.awarded_at || record.created_at
          };
        })
        .filter(Boolean) || []; // Filtriamo eventuali valori null
        
        res.json(userRewards);
      } catch (error) {
        console.error("Error getting user rewards:", error);
        res.status(500).json({ error: "Failed to get user rewards" });
      }
    });
  }
  console.log('[Server] Configurazione route completata, server pronto');
  return httpServer;
}