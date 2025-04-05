import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema, insertBadgeSchema, insertRewardSchema, insertGameBadgeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

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
