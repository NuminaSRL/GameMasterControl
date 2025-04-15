import { Router } from 'express';
import { gamesController } from '../controllers/games-controller';

const router = Router();

// MODIFICA: Rimuovi '/games' dal percorso poiché questo router sarà già montato su '/games'
router.put('/:id/settings', gamesController.updateGameSettings);

// Endpoint per recuperare tutti i giochi disponibili
router.get('/', gamesController.getAllGames.bind(gamesController));

// Endpoint per recuperare un gioco specifico con le sue impostazioni
router.get('/:id', gamesController.getGame.bind(gamesController));

// Endpoint per recuperare le impostazioni di un gioco
// Nota: cambiato da /:gameId/settings a mantenere la compatibilità con il vecchio endpoint
router.get('/:gameId/settings', gamesController.getGameSettings.bind(gamesController));
router.get('-settings/:gameId', gamesController.getGameSettings.bind(gamesController)); // Per compatibilità con /game-settings/:gameId

// Endpoint per recuperare tutti i badge di un gioco
router.get('/:gameId/badges', gamesController.getGameBadges.bind(gamesController));

// Aggiungi questi endpoint per gestire i premi associati ai giochi
router.get('/:gameId/rewards', gamesController.getGameRewards.bind(gamesController));
router.post('/:gameId/rewards/:rewardId', gamesController.associateRewardToGame.bind(gamesController));
router.delete('/:gameId/rewards/:rewardId', gamesController.removeRewardFromGame.bind(gamesController));

export default router;