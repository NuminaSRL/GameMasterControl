/**
 * Entry point for Feltrinelli client integration
 * This allows us to gradually migrate functionality while keeping backward compatibility
 */

import { Router } from 'express';
import { config } from '../../../config';
import gameRoutes from './game-routes';
import rewardRoutes from './reward-routes';
import gameRewardRoutes from './game-reward-routes';
// Import the old handlers using ES Module syntax
import * as oldHandlers from '../../../flt-simple-api';

// Create a router for the new structure
const feltrinelliRouter = Router();

// Determine if we should use the new implementation based on config
const useNewImplementation = config.ENABLE_NEW_FELTRINELLI_IMPLEMENTATION;

console.log(`[Feltrinelli Router] Feature flag ENABLE_NEW_FELTRINELLI_IMPLEMENTATION = ${useNewImplementation}`);
console.log('[Feltrinelli Router] Inizializzazione router');

if (useNewImplementation) {
  console.log('[Feltrinelli Router] Using NEW implementation');
  
  // Import and use the new implementation
  console.log('[Feltrinelli Router] Montaggio rotte giochi su /games');
  feltrinelliRouter.use('/games', gameRoutes);
  
  console.log('[Feltrinelli Router] Montaggio rotte premi su /rewards');
  feltrinelliRouter.use('/rewards', rewardRoutes);
  
  // Aggiungi le rotte per le associazioni premi-giochi
  console.log('[Feltrinelli Router] Montaggio rotte associazioni premi-giochi su /games');
  feltrinelliRouter.use('/games', gameRewardRoutes);
  
  // Log delle rotte configurate
  console.log('[Feltrinelli Router] Rotte configurate:', feltrinelliRouter.stack.map(r => ({ 
    path: r.regexp?.toString(), 
    handle: r.handle?.name || 'router'
  })));
  
  // For any routes not yet migrated, fall back to the old implementation
  feltrinelliRouter.get('/rewards-all', oldHandlers.getAllFLTRewards);
  feltrinelliRouter.get('/badges', oldHandlers.getAllBadges);
  feltrinelliRouter.get('/badges/:id', oldHandlers.getFLTBadge);
  // Add other fallback routes as needed
} else {
  console.log('[Feltrinelli Router] Using OLD implementation');
  // Use the old implementation (just pass through to the existing handlers)
  
  // Map the old handlers to the new router structure
  feltrinelliRouter.get('/games', oldHandlers.getAllFLTGames);
  feltrinelliRouter.get('/games/:id', oldHandlers.getFLTGame);
  feltrinelliRouter.get('/game-settings/:gameId', oldHandlers.getGameSettings);
  feltrinelliRouter.get('/games/:gameId/badges', oldHandlers.getGameBadges);
  feltrinelliRouter.get('/rewards-all', oldHandlers.getAllFLTRewards);
  feltrinelliRouter.get('/rewards', oldHandlers.getAllFLTRewards); // Aggiungiamo questo per compatibilità
  feltrinelliRouter.get('/badges', oldHandlers.getAllBadges);
  // Add other routes as needed
}

export default feltrinelliRouter;