import fs from "fs";
import path from "path";
import type { Pool } from "pg";
import { logger } from "../lib/logger";

/** Arbitrary key so concurrent instances do not migrate at the same time. */
const MIGRATION_LOCK_ID = 872391;

/**
 * Brings the database up to date and returns the migrations it applied.
 *
 * `schema.sql` is the single source of truth for a fresh database; it is
 * written with IF NOT EXISTS so running it on an existing database changes
 * nothing. Changes to an existing database go in `migrations/*.sql`, applied
 * once each in filename order and recorded in `schema_migrations`.
 */
export async function runMigrations(pool: Pool, dir: string = __dirname): Promise<string[]> {
  const client = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);

    await client.query(fs.readFileSync(path.join(dir, "schema.sql"), "utf8"));
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
       )`,
    );

    const migrationsDir = path.join(dir, "migrations");
    const files = fs.existsSync(migrationsDir)
      ? fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort()
      : [];
    const done = new Set(
      (await client.query<{ name: string }>("SELECT name FROM schema_migrations")).rows.map(
        (row) => row.name,
      ),
    );

    for (const file of files) {
      if (done.has(file)) continue;
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
      applied.push(file);
      logger.info(`[DB] Applied migration ${file}`);
    }
    return applied;
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]).catch(() => undefined);
    client.release();
  }
}
