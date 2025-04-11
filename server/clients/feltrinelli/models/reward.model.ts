/**
 * Modelli per i premi Feltrinelli
 */

export interface Reward {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  points: number;
  isActive: boolean;
  type?: string;
  value?: string;
  startDate?: string | null;
  endDate?: string | null;
  rank?: number;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RewardSettings {
  isActive: boolean;
  [key: string]: any;
}