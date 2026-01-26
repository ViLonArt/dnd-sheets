import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * Character sheets table schema using Drizzle ORM
 * Maps to the PostgreSQL table created in the migration
 */
export const characterSheets = pgTable("character_sheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(), // References auth.users(id) - handled by foreign key in SQL
  slug: varchar("slug", { length: 255 }),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CharacterSheet = typeof characterSheets.$inferSelect;
export type NewCharacterSheet = typeof characterSheets.$inferInsert;
