import { Router } from 'express';
import { RewardGamesController } from '../controllers/reward-games-controller';

const router = Router();
const rewardGamesController = new RewardGamesController();

console.log('[GameRewardRoutes] Inizializzazione delle rotte');

// Recupera tutti i premi associati a un gioco
router.get('/:gameId/rewards', (req, res) => {
  console.log('[GameRewardRoutes] Richiesta GET /:gameId/rewards ricevuta');
  rewardGamesController.getGameRewards(req, res);
});

// Associa un premio a un gioco
router.post('/:gameId/rewards/:rewardId', (req, res) => {
  console.log('[GameRewardRoutes] Richiesta POST /:gameId/rewards/:rewardId ricevuta');
  rewardGamesController.associateRewardToGame(req, res);
});

// Rimuove l'associazione tra un premio e un gioco
router.delete('/:gameId/rewards/:rewardId', (req, res) => {
  console.log('[GameRewardRoutes] Richiesta DELETE /:gameId/rewards/:rewardId ricevuta');
  rewardGamesController.removeRewardFromGame(req, res);
});

// Rimuove tutte le associazioni premi per un gioco
router.delete('/:gameId/rewards', (req, res) => {
  console.log('[GameRewardRoutes] Richiesta DELETE /:gameId/rewards ricevuta');
  rewardGamesController.removeAllRewardsFromGame(req, res);
});

// Log delle rotte configurate
console.log('[GameRewardRoutes] Rotte configurate:', 
  router.stack.map(r => ({
    path: r.route?.path || 'unknown',
    methods: r.route ? Object.keys(r.route).filter(k => k !== 'path' && k !== 'stack') : []
  }))
);

export default router;