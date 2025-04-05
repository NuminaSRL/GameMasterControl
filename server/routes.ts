import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema, insertBadgeSchema, insertRewardSchema, insertGameBadgeSchema } from "@shared/schema";
import * as feltrinelliApi from "./feltrinelli-api";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // === FELTRINELLI API INTEGRATION ===
  
  // Verifica connessione alle API di Feltrinelli
  app.get('/api/feltrinelli/health', async (req, res) => {
    try {
      const isHealthy = await feltrinelliApi.healthCheck();
      if (isHealthy) {
        res.json({ status: 'ok', message: 'Feltrinelli Gaming API is connected' });
      } else {
        res.status(503).json({ status: 'error', message: 'Feltrinelli Gaming API is not available' });
      }
    } catch (error) {
      res.status(500).json({ status: 'error', message: `Error connecting to Feltrinelli API: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Sessione di gioco
  app.post('/api/feltrinelli/session', async (req, res) => {
    try {
      const { userId, gameType } = req.body;
      
      if (!userId || !gameType) {
        return res.status(400).json({ message: 'userId and gameType are required' });
      }
      
      if (!['books', 'authors', 'years'].includes(gameType)) {
        return res.status(400).json({ message: 'gameType must be one of: books, authors, years' });
      }
      
      const session = await feltrinelliApi.createGameSession(userId, gameType as 'books' | 'authors' | 'years');
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: `Error creating game session: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Domande Quiz Libri
  app.get('/api/feltrinelli/bookquiz/question', async (req, res) => {
    try {
      const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : 1;
      const question = await feltrinelliApi.getBookQuizQuestion(difficulty);
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: `Error fetching book quiz question: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  });

  // Risposte Quiz Libri
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

  return httpServer;
}
