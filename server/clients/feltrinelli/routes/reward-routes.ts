import { Router } from 'express';
import { rewardsController } from '../controllers/rewards-controller';

const router = Router();

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

export default router;