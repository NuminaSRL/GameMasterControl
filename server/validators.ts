import { 
    type InsertGame, 
    type InsertBadge, 
    type InsertReward, 
    type InsertGameBadge 
  } from "./shared/schema";
  
  // Funzione di validazione generica
  function validateObject<T>(data: any, requiredFields: string[]): T {
    // Verifica che tutti i campi richiesti siano presenti
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        throw new Error(`Campo richiesto mancante: ${field}`);
      }
    }
    return data as T;
  }
  
  // Validazione per InsertGame
  export const insertGameSchema = {
    parse: (data: any): InsertGame => {
      return validateObject<InsertGame>(data, [
        'name', 'description', 'isActive', 'timerDuration', 
        'questionCount', 'weeklyLeaderboard', 'monthlyLeaderboard', 
        'reward', 'gameType', 'difficulty'
      ]);
    },
    partial: () => ({
      parse: (data: any): Partial<InsertGame> => {
        return data as Partial<InsertGame>;
      }
    })
  };
  
  // Validazione per InsertBadge
  export const insertBadgeSchema = {
    parse: (data: any): InsertBadge => {
      return validateObject<InsertBadge>(data, [
        'name', 'description', 'icon', 'color'
      ]);
    }
  };
  
  // Validazione per InsertReward
  export const insertRewardSchema = {
    parse: (data: any): InsertReward => {
      return validateObject<InsertReward>(data, [
        'name', 'description', 'type', 'value', 'icon', 'color', 'available', 'gameType'
      ]);
    },
    partial: () => ({
      parse: (data: any): Partial<InsertReward> => {
        return data as Partial<InsertReward>;
      }
    })
  };
  
  // Validazione per InsertGameBadge
  export const insertGameBadgeSchema = {
    parse: (data: any): InsertGameBadge => {
      return validateObject<InsertGameBadge>(data, [
        'gameId', 'badgeId'
      ]);
    }
  };