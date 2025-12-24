import { pgTable, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Sheets table schema using Drizzle ORM
 * Maps to the PostgreSQL table created in the migration
 */
export const sheets = pgTable("sheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(), // References auth.users(id) - handled by foreign key in SQL
  data: jsonb("data").notNull(), // Stores the Character or NPC Zod schema
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Type inference for TypeScript
export type Sheet = typeof sheets.$inferSelect;
export type NewSheet = typeof sheets.$inferInsert;

