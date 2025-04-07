import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema (keeping the original one)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  // a user could have relationships to other tables in the future
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// User profiles - mapping al database Feltrinelli
export const fltUserProfiles = pgTable("flt_user_profiles", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().unique(), // ID utente Feltrinelli 
  internalUserId: integer("internal_user_id").references(() => users.id), // Riferimento al nostro sistema
  username: text("username").notNull(),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fltUserProfilesRelations = relations(fltUserProfiles, ({ one }) => ({
  user: one(users, {
    fields: [fltUserProfiles.internalUserId],
    references: [users.id]
  })
}));

export const insertFltUserProfileSchema = createInsertSchema(fltUserProfiles).omit({
  createdAt: true,
  updatedAt: true
});

// Game schema
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  timerDuration: integer("timer_duration").notNull(), // in seconds
  questionCount: integer("question_count").notNull(),
  weeklyLeaderboard: boolean("weekly_leaderboard").notNull().default(true),
  monthlyLeaderboard: boolean("monthly_leaderboard").notNull().default(true),
  reward: text("reward").notNull(),
  gameType: text("game_type", { enum: ["books", "authors", "years"] }).default('books'),
  feltrinelliGameId: text("feltrinelli_game_id").default('00000000-0000-0000-0000-000000000001'), // UUID from Feltrinelli API
  difficulty: integer("difficulty").notNull().default(1), // 1-3 scale
  createdAt: timestamp("created_at").defaultNow(),
});

export const gamesRelations = relations(games, ({ many }) => ({
  badges: many(gameBadges)
}));

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true
});

// Badge schema
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const badgesRelations = relations(badges, ({ many }) => ({
  games: many(gameBadges)
}));

export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true
});

// Game-Badge mapping (many-to-many)
export const gameBadges = pgTable("flt_game_badges", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => games.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
});

export const gameBadgesRelations = relations(gameBadges, ({ one }) => ({
  game: one(games, {
    fields: [gameBadges.gameId],
    references: [games.id]
  }),
  badge: one(badges, {
    fields: [gameBadges.badgeId],
    references: [badges.id]
  })
}));

export const insertGameBadgeSchema = createInsertSchema(gameBadges).omit({
  id: true
});

// Reward schema
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  value: text("value").notNull(),
  rank: integer("rank").notNull().default(10), // Position in leaderboard for this reward
  imageUrl: text("image_url"), // URL to image (can be base64 or external URL)
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  available: integer("available").notNull(),
  gameType: text("game_type", { enum: ["books", "authors", "years"] }).default('books'),
  feltrinelliRewardId: text("feltrinelli_reward_id"), // ID from Feltrinelli API if applicable
  isImported: boolean("is_imported").default(false), // Indicates if this reward is imported from Feltrinelli
  pointsRequired: integer("points_required").default(0), // Points required to earn this reward
  originalImageUrl: text("original_image_url"), // Original image URL from Feltrinelli (if imported)
  syncedAt: timestamp("synced_at"), // When this reward was last synced from Feltrinelli
  createdAt: timestamp("created_at").defaultNow(),
});

export const rewardsRelations = relations(rewards, ({ }) => ({
  // Rewards could have relationships to other tables in the future
}));

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true
});

// Stats schema (for dashboard)
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  totalGames: integer("total_games").notNull().default(0),
  activeGames: integer("active_games").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  awardedBadges: integer("awarded_badges").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// FELTRINELLI API - TABELLE PER MAPPING ED ESPOSIZIONE API

// Tabella per gli utenti Feltrinelli (semplificata)
export const flt_users = pgTable("flt_users", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  active: boolean("active").notNull().default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFLTUserSchema = createInsertSchema(flt_users).omit({
  createdAt: true,
  updatedAt: true
});

// Tabella per i giochi Feltrinelli (semplificata) - Rimossa per evitare conflitti
// Usare fltGames al posto di flt_games

// Tabella per le impostazioni dei giochi Feltrinelli
export const gameSettings = pgTable("flt_game_settings", {
  id: uuid("id").primaryKey(),
  gameId: uuid("game_id").notNull().references(() => fltGames.id),
  timeDuration: integer("time_duration").notNull().default(30),
  questionCount: integer("question_count").notNull().default(5),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameSettingsRelations = relations(gameSettings, ({ one }) => ({
  game: one(fltGames, {
    fields: [gameSettings.gameId],
    references: [fltGames.id]
  })
}));

export const insertGameSettingsSchema = createInsertSchema(gameSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tabella per i premi Feltrinelli (semplificata)
export const flt_rewards = pgTable("flt_rewards", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  gameId: uuid("game_id").references(() => fltGames.id),
  type: text("type").notNull(),
  value: text("value").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  available: integer("available").notNull(),
  active: boolean("active").notNull().default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const flt_rewardsRelations = relations(flt_rewards, ({ one }) => ({
  game: one(fltGames, {
    fields: [flt_rewards.gameId],
    references: [fltGames.id]
  })
}));

export const insertFLTRewardSchema = createInsertSchema(flt_rewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tabella per le sessioni di gioco Feltrinelli
export const fltGameSessions = pgTable("flt_game_sessions", {
  id: uuid("id").primaryKey(),
  sessionId: uuid("session_id").notNull().unique(),
  userId: uuid("user_id").notNull(), // ID utente Feltrinelli
  gameId: uuid("game_id").notNull(), // ID gioco Feltrinelli
  internalGameId: integer("internal_game_id").references(() => games.id), // Riferimento al nostro gioco
  score: integer("score").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fltGameSessionsRelations = relations(fltGameSessions, ({ one }) => ({
  game: one(games, {
    fields: [fltGameSessions.internalGameId],
    references: [games.id]
  })
}));

export const insertFltGameSessionSchema = createInsertSchema(fltGameSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tabella per mappare i giochi Feltrinelli ai nostri giochi
export const fltGames = pgTable("flt_games", {
  id: uuid("id").primaryKey(),
  feltrinelliId: uuid("feltrinelli_id").notNull().unique(), // ID del gioco in Feltrinelli
  internalId: integer("internal_id").notNull().references(() => games.id), // ID del gioco nel nostro sistema
  name: text("name").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fltGamesRelations = relations(fltGames, ({ one }) => ({
  game: one(games, {
    fields: [fltGames.internalId],
    references: [games.id]
  })
}));

export const insertFltGameSchema = createInsertSchema(fltGames).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tabella per le risposte Feltrinelli
export const fltAnswerOptions = pgTable("flt_answer_options", {
  id: uuid("id").primaryKey(),
  questionId: uuid("question_id").notNull(),
  bookId: uuid("book_id").notNull(), 
  isCorrect: boolean("is_correct").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFltAnswerOptionSchema = createInsertSchema(fltAnswerOptions).omit({
  id: true,
  createdAt: true
});

// Tabella per le classifiche Feltrinelli
export const fltLeaderboard = pgTable("flt_leaderboard", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(), // ID utente Feltrinelli
  gameId: uuid("game_id").notNull(), // ID gioco Feltrinelli  
  internalGameId: integer("internal_game_id").references(() => games.id), // Riferimento al nostro gioco
  points: integer("points").notNull().default(0),
  period: text("period", { enum: ["all_time", "monthly", "weekly"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fltLeaderboardRelations = relations(fltLeaderboard, ({ one }) => ({
  game: one(games, {
    fields: [fltLeaderboard.internalGameId],
    references: [games.id]
  })
}));

export const insertFltLeaderboardSchema = createInsertSchema(fltLeaderboard).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tabella per i premi assegnati agli utenti Feltrinelli
export const fltUserRewards = pgTable("flt_user_rewards", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  rewardId: integer("reward_id").notNull().references(() => rewards.id), // Riferimento al nostro reward
  gameId: uuid("game_id").notNull(),
  internalGameId: integer("internal_game_id").references(() => games.id),
  period: text("period", { enum: ["all_time", "monthly", "weekly"] }).notNull(),
  rank: integer("rank").notNull(), // Posizione in classifica
  claimedAt: timestamp("claimed_at").defaultNow(),
});

export const fltUserRewardsRelations = relations(fltUserRewards, ({ one }) => ({
  reward: one(rewards, {
    fields: [fltUserRewards.rewardId],
    references: [rewards.id]
  }),
  game: one(games, {
    fields: [fltUserRewards.internalGameId],
    references: [games.id]
  })
}));

export const insertFltUserRewardSchema = createInsertSchema(fltUserRewards).omit({
  id: true,
  claimedAt: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFltUserProfile = z.infer<typeof insertFltUserProfileSchema>;
export type FltUserProfile = typeof fltUserProfiles.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type InsertFltGame = z.infer<typeof insertFltGameSchema>;
export type FltGame = typeof fltGames.$inferSelect;

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export type InsertGameBadge = z.infer<typeof insertGameBadgeSchema>;
export type GameBadge = typeof gameBadges.$inferSelect;

export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;

export type InsertFltGameSession = z.infer<typeof insertFltGameSessionSchema>;
export type FltGameSession = typeof fltGameSessions.$inferSelect;

export type InsertFltAnswerOption = z.infer<typeof insertFltAnswerOptionSchema>;
export type FltAnswerOption = typeof fltAnswerOptions.$inferSelect;

export type InsertFltLeaderboard = z.infer<typeof insertFltLeaderboardSchema>;
export type FltLeaderboard = typeof fltLeaderboard.$inferSelect;

export type InsertFltUserReward = z.infer<typeof insertFltUserRewardSchema>;
export type FltUserReward = typeof fltUserRewards.$inferSelect;

// Nuovi tipi per le tabelle semplificate
export type InsertFLTUser = z.infer<typeof insertFLTUserSchema>;
export type FLTUser = typeof flt_users.$inferSelect;

// Ridefiniamo il tipo per chiarezza e consistenza
export type FLTGame = typeof fltGames.$inferSelect;

export type InsertFLTReward = z.infer<typeof insertFLTRewardSchema>;
export type FLTReward = typeof flt_rewards.$inferSelect;

export type InsertGameSettings = z.infer<typeof insertGameSettingsSchema>;
export type GameSettings = typeof gameSettings.$inferSelect;

export type Stats = typeof stats.$inferSelect;
