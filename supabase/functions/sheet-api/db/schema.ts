import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Sheets table schema using Drizzle ORM
 * Maps to the PostgreSQL table created in the migration
 */
export const sheets = pgTable("sheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(), // References auth.users(id) - handled by foreign key in SQL
  slug: varchar("slug", { length: 255 }), // Optional slug for human-readable URLs (e.g., "gandalf-k9s2")
  data: jsonb("data").notNull(), // Stores the Character or NPC Zod schema
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Type inference for TypeScript
export type Sheet = typeof sheets.$inferSelect;
export type NewSheet = typeof sheets.$inferInsert;

