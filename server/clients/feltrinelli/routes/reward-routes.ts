import { Router } from 'express';
import { rewardsController } from '../controllers/rewards-controller';
import { RewardGamesController } from '../controllers/reward-games-controller';

const router = Router();
const rewardGamesController = new RewardGamesController();

// Endpoint per recuperare tutti i premi
router.get('/', rewardsController.getAllRewards.bind(rewardsController));

// Endpoint per creare un nuovo premio
router.post('/', rewardsController.createReward.bind(rewardsController));

// Endpoint per recuperare un premio specifico
router.get('/:id', rewardsController.getReward.bind(rewardsController));

// Endpoint per aggiornare un premio esistente
router.put('/:id', rewardsController.updateReward.bind(rewardsController));

// Endpoint per aggiornare le impostazioni di un premio
router.put('/:id/settings', rewardsController.updateRewardSettings.bind(rewardsController));

// Aggiungiamo le rotte per le associazioni premi-giochi
// Recupera tutti i giochi associati a un premio
router.get('/:rewardId/games', rewardGamesController.getRewardGames.bind(rewardGamesController));

export default router;