/**
 * Entry point for Feltrinelli client integration
 * This allows us to gradually migrate functionality while keeping backward compatibility
 */

import { Router } from 'express';
import { config } from '../../../config';
import gameRoutes from './game-routes';

// Create a router for the new structure
const feltrinelliRouter = Router();

// Determine if we should use the new implementation based on config
const useNewImplementation = config.ENABLE_NEW_FELTRINELLI_IMPLEMENTATION === 'true';

if (useNewImplementation) {
  // Import and use the new implementation
  feltrinelliRouter.use('/games', gameRoutes);
  
  // Add other new routes as they are developed
  // feltrinelliRouter.use('/badges', badgeRoutes);
  // feltrinelliRouter.use('/rewards', rewardRoutes);
  // feltrinelliRouter.use('/sessions', sessionRoutes);
  
  // For any routes not yet migrated, fall back to the old implementation
  const oldHandlers = require('../../../flt-simple-api');
  feltrinelliRouter.get('/rewards-all', oldHandlers.getAllFLTRewards);
  feltrinelliRouter.get('/badges', oldHandlers.getAllBadges);
  feltrinelliRouter.get('/badges/:id', oldHandlers.getFLTBadge);
  // Add other fallback routes as needed
} else {
  // Use the old implementation (just pass through to the existing handlers)
  const oldHandlers = require('../../../flt-simple-api');
  
  // Map the old handlers to the new router structure
  feltrinelliRouter.get('/games', oldHandlers.getAllFLTGames);
  feltrinelliRouter.get('/games/:id', oldHandlers.getFLTGame);
  feltrinelliRouter.get('/game-settings/:gameId', oldHandlers.getGameSettings);
  feltrinelliRouter.get('/games/:gameId/badges', oldHandlers.getGameBadges);
  feltrinelliRouter.get('/rewards-all', oldHandlers.getAllFLTRewards);
  feltrinelliRouter.get('/badges', oldHandlers.getAllBadges);
  feltrinelliRouter.get('/badges/:id', oldHandlers.getFLTBadge);
  // Add other routes as needed
}

export default feltrinelliRouter;