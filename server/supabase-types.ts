import { z } from "zod";

// Definizione dei tipi per le tabelle Supabase
export interface User {
  id: number;
  username: string;
  password: string;
}

export interface FltUserProfile {
  id: string;
  user_id: string;
  internal_user_id?: number;
  username: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  timer_duration: number;
  question_count: number;
  weekly_leaderboard: boolean;
  monthly_leaderboard: boolean;
  reward: string;
  game_type: "books" | "authors" | "years";
  feltrinelli_game_id: string;
  difficulty: number;
  created_at: string;
}

export interface FltGame {
  id: string;
  feltrinelli_id: string;
  internal_id: number;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface GameBadge {
  id: number;
  game_id: number;
  badge_id: number;
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  type: string;
  value: string;
  rank: number;
  image_url?: string;
  icon: string;
  color: string;
  available: number;
  game_type: "books" | "authors" | "years";
  feltrinelli_reward_id?: string;
  is_imported: boolean;
  points_required: number;
  original_image_url?: string;
  synced_at?: string;
  created_at: string;
}

export interface FltGameSession {
  id: string;
  session_id: string;
  user_id: string;
  game_id: string;
  internal_game_id?: number;
  score: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface FltAnswerOption {
  id: string;
  question_id: string;
  book_id: string;
  is_correct: boolean;
  created_at: string;
}

export interface FltLeaderboard {
  id: number;
  user_id: string;
  game_id: string;
  internal_game_id?: number;
  points: number;
  period: "all_time" | "monthly" | "weekly";
  created_at: string;
  updated_at: string;
}

export interface FltUserReward {
  id: number;
  user_id: string;
  reward_id: number;
  game_id: string;
  internal_game_id: number;
  period: "all_time" | "monthly" | "weekly";
  rank: number;
  claimed_at: string;
}

export interface FLTUser {
  id: string;
  user_id: string;
  active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface FLTReward {
  id: string;
  name: string;
  description: string;
  game_id?: string;
  type: string;
  value: string;
  icon: string;
  color: string;
  available: number;
  active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GameSettings {
  id: string;
  game_id: string;
  time_duration: number;
  question_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  id: number;
  total_games: number;
  active_games: number;
  active_users: number;
  awarded_badges: number;
  updated_at: string;
}

// Schemi Zod per la validazione
export const userSchema = z.object({
  id: z.number().optional(),
  username: z.string(),
  password: z.string()
});

export const fltUserProfileSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  internal_user_id: z.number().optional(),
  username: z.string(),
  email: z.string().email().optional(),
  avatar_url: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

// Aggiungi altri schemi Zod secondo necessità