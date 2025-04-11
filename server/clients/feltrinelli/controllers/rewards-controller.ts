import { Request, Response } from 'express';
import { rewardService } from '../services/reward-service';

/**
 * Controller per la gestione delle richieste relative ai premi
 */
export class RewardsController {
  /**
   * Recupera tutti i premi disponibili
   */
  async getAllRewards(req: Request, res: Response) {
    try {
      const rewards = await rewardService.getAllRewards();
      res.json(rewards);
    } catch (error) {
      console.error('[RewardsController] Error fetching all rewards:', error);
      res.status(500).json({ 
        message: `Error fetching rewards: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  /**
   * Recupera un premio specifico
   */
  async getReward(req: Request, res: Response) {
    try {
      const reward = await rewardService.getReward(req.params.id);
      res.json(reward);
    } catch (error) {
      console.error(`[RewardsController] Error fetching reward with ID ${req.params.id}:`, error);
      res.status(500).json({ 
        message: `Error fetching reward: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  /**
   * Crea un nuovo premio
   */
  async createReward(req: Request, res: Response) {
    try {
      const rewardData = req.body;
      const reward = await rewardService.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      console.error('[RewardsController] Error creating reward:', error);
      res.status(500).json({ 
        message: `Error creating reward: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  /**
   * Aggiorna un premio esistente
   */
  async updateReward(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rewardData = req.body;
      const reward = await rewardService.updateReward(id, rewardData);
      res.json(reward);
    } catch (error) {
      console.error(`[RewardsController] Error updating reward with ID ${req.params.id}:`, error);
      res.status(500).json({ 
        message: `Error updating reward: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  /**
   * Aggiorna le impostazioni di un premio
   */
  async updateRewardSettings(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const settings = req.body;
      const reward = await rewardService.updateRewardSettings(id, settings);
      res.json(reward);
    } catch (error) {
      console.error(`[RewardsController] Error updating settings for reward ${req.params.id}:`, error);
      res.status(500).json({ 
        message: `Error updating reward settings: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
}

// Esporta un'istanza singleton del controller
export const rewardsController = new RewardsController();