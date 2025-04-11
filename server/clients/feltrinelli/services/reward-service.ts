import { supabase } from '../../../supabase';
import { Reward, RewardSettings } from '../models/reward.model';

/**
 * Servizio per la gestione dei premi Feltrinelli
 */
export class RewardService {
  constructor() {
    console.log('🔍 INITIALIZED: RewardService from clients/feltrinelli/services/reward-service.ts');
  }

  /**
   * Recupera tutti i premi disponibili
   */
  // First, let's update the getAllRewards method to include all fields
  async getAllRewards(): Promise<Reward[]> {
    try {
      console.log('📣 CALLED: getAllRewards from clients/feltrinelli/services/reward-service.ts');
      const { data, error } = await supabase
        .from('flt_rewards')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      return data?.map(reward => ({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        imageUrl: reward.image_url,
        points: reward.points,
        isActive: reward.is_active,
        type: reward.type,
        value: reward.value,
        startDate: reward.start_date,
        endDate: reward.end_date,
        rank: reward.rank,
        icon: reward.icon,
        color: reward.color,
        createdAt: reward.created_at,
        updatedAt: reward.updated_at
      })) || [];
    } catch (error) {
      console.error('[RewardService] Error fetching all rewards:', error);
      throw error;
    }
  }

  /**
   * Recupera un premio specifico
   */
  async getReward(id: string): Promise<Reward> {
    try {
      console.log(`📣 CALLED: getReward(${id}) from clients/feltrinelli/services/reward-service.ts`);
      const { data, error } = await supabase
        .from('flt_rewards')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error(`Reward with ID ${id} not found`);
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        imageUrl: data.image_url,
        points: data.points,
        isActive: data.is_active,
        type: data.type,
        value: data.value,
        startDate: data.start_date,
        endDate: data.end_date,
        rank: data.rank,
        icon: data.icon,
        color: data.color,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error(`[RewardService] Error fetching reward with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crea un nuovo premio
   */
  async createReward(rewardData: Partial<Reward>): Promise<Reward> {
    try {
      console.log(`📣 CALLED: createReward from clients/feltrinelli/services/reward-service.ts`);
      
      const { data, error } = await supabase
        .from('flt_rewards')
        .insert({
          name: rewardData.name,
          description: rewardData.description || '',
          image_url: rewardData.imageUrl || '',
          points: rewardData.points || 0,
          is_active: rewardData.isActive !== undefined ? rewardData.isActive : true,
          type: rewardData.type || 'merchandise',
          value: rewardData.value || '',
          start_date: rewardData.startDate || null,
          end_date: rewardData.endDate || null,
          rank: rewardData.rank || 0,
          icon: rewardData.icon || '',
          color: rewardData.color || '#000000',
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        imageUrl: data.image_url,
        points: data.points,
        isActive: data.is_active,
        type: data.type,
        value: data.value,
        startDate: data.start_date,
        endDate: data.end_date,
        rank: data.rank,
        icon: data.icon,
        color: data.color,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('[RewardService] Error creating reward:', error);
      throw error;
    }
  }

  /**
   * Aggiorna un premio esistente
   */
  async updateReward(id: string, rewardData: Partial<Reward>): Promise<Reward> {
    try {
      console.log(`📣 CALLED: updateReward(${id}) from clients/feltrinelli/services/reward-service.ts`);
      
      const updateData: any = {
        updated_at: new Date()
      };
      
      if (rewardData.name !== undefined) updateData.name = rewardData.name;
      if (rewardData.description !== undefined) updateData.description = rewardData.description;
      if (rewardData.imageUrl !== undefined) updateData.image_url = rewardData.imageUrl;
      if (rewardData.points !== undefined) updateData.points = rewardData.points;
      if (rewardData.isActive !== undefined) updateData.is_active = rewardData.isActive;
      if (rewardData.type !== undefined) updateData.type = rewardData.type;
      if (rewardData.value !== undefined) updateData.value = rewardData.value;
      if (rewardData.startDate !== undefined) updateData.start_date = rewardData.startDate;
      if (rewardData.endDate !== undefined) updateData.end_date = rewardData.endDate;
      if (rewardData.rank !== undefined) updateData.rank = rewardData.rank;
      if (rewardData.icon !== undefined) updateData.icon = rewardData.icon;
      if (rewardData.color !== undefined) updateData.color = rewardData.color;
      
      const { data, error } = await supabase
        .from('flt_rewards')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        imageUrl: data.image_url,
        points: data.points,
        isActive: data.is_active,
        type: data.type,
        value: data.value,
        startDate: data.start_date,
        endDate: data.end_date,
        rank: data.rank,
        icon: data.icon,
        color: data.color,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error(`[RewardService] Error updating reward with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Aggiorna le impostazioni di un premio
   */
  async updateRewardSettings(id: string, settings: RewardSettings): Promise<Reward> {
    try {
      console.log(`📣 CALLED: updateRewardSettings(${id}) from clients/feltrinelli/services/reward-service.ts`);
      
      const { data, error } = await supabase
        .from('flt_rewards')
        .update({
          is_active: settings.isActive,
          updated_at: new Date()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        imageUrl: data.image_url,
        points: data.points,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error(`[RewardService] Error updating settings for reward ${id}:`, error);
      throw error;
    }
  }
}

// Esporta un'istanza singleton del servizio
export const rewardService = new RewardService();