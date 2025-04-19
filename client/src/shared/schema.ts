import { z } from "zod";

// Definiamo gli schemi Zod senza dipendere da Drizzle
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string()
});

export const insertGameSchema = z.object({
  name: z.string(),
  description: z.string(),
  isActive: z.boolean().default(true),
  timerDuration: z.number(),
  questionCount: z.number(),
  weeklyLeaderboard: z.boolean().default(true),
  monthlyLeaderboard: z.boolean().default(true),
  reward: z.string(),
  gameType: z.enum(["books", "authors", "years"]).default("books"),
  feltrinelliGameId: z.string().default("00000000-0000-0000-0000-000000000001"),
  difficulty: z.number().default(1)
});

export const insertBadgeSchema = z.object({
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  color: z.string()
});

export const insertGameBadgeSchema = z.object({
  gameId: z.number(),
  badgeId: z.number()
});

export const insertRewardSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.string(),
  value: z.string(),
  rank: z.number().default(10),
  imageUrl: z.string().optional(),
  icon: z.string(),
  color: z.string(),
  available: z.number(),
  gameType: z.enum(["books", "authors", "years"]).default("books"),
  feltrinelliRewardId: z.string().optional(),
  isImported: z.boolean().default(false),
  pointsRequired: z.number().default(0),
  originalImageUrl: z.string().optional(),
  syncedAt: z.date().optional()
});

export const insertFltGameSchema = z.object({
  feltrinelliId: z.string().uuid(),
  internalId: z.number(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean().default(true)
});

export const insertGameSettingsSchema = z.object({
  gameId: z.string().uuid(),
  timeDuration: z.number().default(30),
  questionCount: z.number().default(5),
  active: z.boolean().default(true)
});

export const insertFLTRewardSchema = z.object({
  name: z.string(),
  description: z.string(),
  gameId: z.string().uuid().optional(),
  type: z.string(),
  value: z.string(),
  icon: z.string(),
  color: z.string(),
  available: z.number(),
  active: z.boolean().default(true),
  startDate: z.date().optional(),
  endDate: z.date().optional()
});

// Definizione dei tipi
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type InsertGameBadge = z.infer<typeof insertGameBadgeSchema>;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type InsertFltGame = z.infer<typeof insertFltGameSchema>;
export type InsertGameSettings = z.infer<typeof insertGameSettingsSchema>;
export type InsertFLTReward = z.infer<typeof insertFLTRewardSchema>;

// Definizione di tipi di interfaccia per i dati
export interface User {
  id: number;
  username: string;
  password: string;
}

export interface Game {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  timerDuration: number;
  questionCount: number;
  weeklyLeaderboard: boolean;
  monthlyLeaderboard: boolean;
  reward: string;
  gameType: string;
  feltrinelliGameId: string;
  difficulty: number;
  createdAt: Date;
  startDate?: string;
  endDate?: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: Date;
}

export interface GameBadge {
  id: number;
  gameId: number;
  badgeId: number;
}

export interface Reward {
  id: number;
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

export interface FltGame {
  id: string;
  feltrinelliId: string;
  internalId: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameSettings {
  id: string;
  gameId: string;
  timeDuration: number;
  questionCount: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FLTReward {
  id: string;
  name: string;
  description: string;
  gameId?: string;
  type: string;
  value: string;
  icon: string;
  color: string;
  available: number;
  active: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stats {
  id: number;
  totalGames: number;
  activeGames: number;
  activeUsers: number;
  awardedBadges: number;
  updatedAt: Date;
}