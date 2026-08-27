import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;
const migrationsDirectory = path.join(process.cwd(), "migrations");

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // .env.local is optional; the message below explains the required setting.
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL no está configurada. Copia .env.example a .env.local y complétala.");
  process.exitCode = 1;
} else {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    const applied = await client.query("SELECT filename FROM schema_migrations");
    const appliedFiles = new Set(applied.rows.map((row) => row.filename));
    const files = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (appliedFiles.has(file)) continue;

      const sql = await readFile(path.join(migrationsDirectory, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`Aplicada: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("Base de datos actualizada.");
  } catch (error) {
    const reason = error instanceof Error
      ? error.message || ("code" in error ? String(error.code) : "error desconocido")
      : String(error);
    console.error(`No se pudieron aplicar las migraciones: ${reason}`);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}
