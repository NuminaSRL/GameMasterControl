import { Router } from 'express';
import { gamesController } from '../controllers/games-controller';

const router = Router();

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

export default router;