// Rimuoviamo le importazioni di Drizzle e definiamo interfacce TypeScript

// Definiamo le interfacce per gli utenti
export interface User {
  id: number;
  email: string;
  password: string;
  username?: string; // Reso opzionale
}

export interface InsertUser {
  email: string;
  password: string;
  username?: string; // Reso opzionale
}

// Interfacce per i profili utente Feltrinelli
export interface FltUserProfile {
  id: string; // UUID
  userId: string; // UUID
  internalUserId?: number;
  username: string;
  email?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertFltUserProfile {
  userId: string;
  internalUserId?: number;
  username: string;
  email?: string;
  avatarUrl?: string;
}

// Interfacce per i giochi
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
  feltrinelliGameId?: string;
  difficulty: number;
  createdAt: Date;
}

export interface InsertGame {
  name: string;
  description: string;
  isActive: boolean;
  timerDuration: number;
  questionCount: number;
  weeklyLeaderboard: boolean;
  monthlyLeaderboard: boolean;
  reward: string;
  gameType: string;
  feltrinelliGameId?: string;
  difficulty: number;
}

// Interfacce per i badge
export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: Date;
}

export interface InsertBadge {
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Interfacce per la relazione gioco-badge
export interface GameBadge {
  id: number;
  gameId: number;
  badgeId: number;
}

export interface InsertGameBadge {
  gameId: number;
  badgeId: number;
}

// Interfacce per i premi
export interface Reward {
  id: number;
  name: string;
  description: string;
  type: string;
  value: string;
  rank: number;
  imageUrl?: string;
  icon: string;
  color: string;
  available: number;
  gameType: string;
  feltrinelliRewardId?: string;
  isImported: boolean;
  pointsRequired: number;
  originalImageUrl?: string;
  syncedAt?: Date;
  createdAt: Date;
}

export interface InsertReward {
  name: string;
  description: string;
  type: string;
  value: string;
  rank?: number;
  imageUrl?: string;
  icon: string;
  color: string;
  available: number;
  gameType: string;
  feltrinelliRewardId?: string;
  isImported?: boolean;
  pointsRequired?: number;
  originalImageUrl?: string;
  syncedAt?: Date;
}

// Interfacce per le statistiche
export interface Stats {
  id: number;
  totalGames: number;
  activeGames: number;
  activeUsers: number;
  awardedBadges: number;
  updatedAt: Date;
}

// Interfacce per gli utenti Feltrinelli
export interface FLTUser {
  id: string; // UUID
  userId: string; // UUID
  active: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertFLTUser {
  userId: string;
  active?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Interfacce per le impostazioni dei giochi
export interface GameSettings {
  id: string; // UUID
  gameId: string; // UUID
  timeDuration: number;
  questionCount: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertGameSettings {
  gameId: string;
  timeDuration?: number;
  questionCount?: number;
  active?: boolean;
  difficulty?: number; // Aggiungiamo questa proprietà
}

// Interfacce per i giochi Feltrinelli
export interface FltGame {
  id: string; // UUID
  feltrinelliId: string; // UUID
  internalId: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertFltGame {
  feltrinelliId: string;
  internalId: number;
  name: string;
  description: string;
  isActive?: boolean;
}

// Interfacce per i premi Feltrinelli
export interface FLTReward {
  id: string; // UUID
  name: string;
  description: string;
  gameId?: string; // UUID
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

export interface InsertFLTReward {
  name: string;
  description: string;
  gameId?: string;
  type: string;
  value: string;
  icon: string;
  color: string;
  available: number;
  active?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Interfacce per le sessioni di gioco
export interface FltGameSession {
  id: string; // UUID
  sessionId: string; // UUID
  userId: string; // UUID
  gameId: string; // UUID
  internalGameId?: number;
  score: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertFltGameSession {
  sessionId: string;
  userId: string;
  gameId: string;
  internalGameId?: number;
  score?: number;
  completed?: boolean;
}

// Interfacce per le opzioni di risposta
export interface FltAnswerOption {
  id: string; // UUID
  questionId: string; // UUID
  bookId: string; // UUID
  isCorrect: boolean;
  createdAt: Date;
}

export interface InsertFltAnswerOption {
  questionId: string;
  bookId: string;
  isCorrect?: boolean;
}

// Interfacce per le classifiche
export interface FltLeaderboard {
  id: number;
  userId: string; // UUID
  gameId: string; // UUID
  internalGameId?: number;
  points: number;
  period: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertFltLeaderboard {
  userId: string;
  gameId: string;
  internalGameId?: number;
  points?: number;
  period: string;
}

// Interfacce per i premi degli utenti
export interface FltUserReward {
  id: number;
  userId: string; // UUID
  rewardId: number;
  gameId: string; // UUID
  internalGameId?: number;
  period: string;
  rank: number;
  claimedAt: Date;
}

export interface InsertFltUserReward {
  userId: string;
  rewardId: number;
  gameId: string;
  internalGameId?: number;
  period: string;
  rank: number;
}

// Esportiamo anche i nomi delle tabelle per compatibilità
export const users = "users";
export const games = "games";
export const badges = "badges";
export const rewards = "rewards";
export const gameBadges = "game_badges";
export const stats = "stats";
export const fltUserProfiles = "flt_user_profiles";
export const fltGames = "flt_games";
export const flt_users = "flt_users";
export const flt_rewards = "flt_rewards";
export const gameSettings = "flt_game_settings";
export const fltGameSessions = "flt_game_sessions";
export const fltAnswerOptions = "flt_answer_options";
export const fltLeaderboard = "flt_leaderboard";
export const fltUserRewards = "flt_user_rewards";