import { hash } from "bcryptjs";
import { Client } from "pg";
import process from "node:process";

if (!process.env.DATABASE_URL) {
  try { process.loadEnvFile(".env.local"); } catch {}
}

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || "Administrador";

if (!process.env.DATABASE_URL || !email || !password || password.length < 12) {
  console.error("Configura DATABASE_URL, ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres).");
  process.exitCode = 1;
} else {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const passwordHash = await hash(password, 12);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = 'admin', updated_at = now()`,
      [name, email, passwordHash],
    );
    console.log(`Administrador preparado: ${email}`);
  } catch (error) {
    console.error(`No se pudo preparar el administrador: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}
