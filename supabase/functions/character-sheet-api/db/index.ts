import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.ts";

/**
 * Get Supabase database connection string from environment
 * 
 * Priority:
 * 1. DATABASE_URL (custom secret - use this for Transaction Pooler on port 6543)
 * 2. SUPABASE_DB_URL (fallback for backwards compatibility)
 * 
 * Format: postgres://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres?pgbouncer=true
 */
const connectionString = Deno.env.get("DATABASE_URL") || Deno.env.get("SUPABASE_DB_URL");

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or SUPABASE_DB_URL environment variable is not set. " +
    "Please set DATABASE_URL in Supabase Dashboard → Edge Functions → Settings → Secrets"
  );
}

/**
 * Create postgres client with prepare: false for Supabase Transaction Pooler
 * This is required when using Supabase's connection pooler (pgbouncer)
 */
const client = postgres(connectionString, {
  prepare: false,
  max: 1, // Edge Functions should use a single connection
});

/**
 * Create Drizzle ORM instance with schema
 */
export const db = drizzle(client, { schema });

/**
 * Close the database connection (call this when done)
 */
export function closeDb() {
  return client.end();
}
