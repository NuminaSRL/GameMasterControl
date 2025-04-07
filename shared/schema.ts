import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
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
export const gameBadges = pgTable("game_badges", {
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export type InsertGameBadge = z.infer<typeof insertGameBadgeSchema>;
export type GameBadge = typeof gameBadges.$inferSelect;

export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Reward = typeof rewards.$inferSelect;

export type Stats = typeof stats.$inferSelect;
