import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Definizione di una tabella semplificata per user_profile Feltrinelli
export const feltrinelliUserProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().unique(), // Solo l'ID utente Feltrinelli come richiesto
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeltrinelliUserProfileSchema = createInsertSchema(feltrinelliUserProfiles).omit({
  createdAt: true
});

export type InsertFeltrinelliUserProfile = z.infer<typeof insertFeltrinelliUserProfileSchema>;
export type FeltrinelliUserProfile = typeof feltrinelliUserProfiles.$inferSelect;