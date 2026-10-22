import { readFile } from "node:fs/promises";
import pg from "pg";

// Neon connection strings already contain sslmode=require
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Neon closes idle connections when it suspends: without a listener the process would crash
pool.on("error", (error) => console.error("Idle database client error", error));

export const query = (text, params) => pool.query(text, params);

export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const readSql = (name) =>
  readFile(new URL(`./db/${name}`, import.meta.url), "utf8");

// Creates the missing tables and loads the initial menu on an empty database
export const setupDatabase = async () => {
  await pool.query(await readSql("schema.sql"));
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM categories");
  if (rows[0].count === 0) {
    await transaction(async (client) => client.query(await readSql("seed.sql")));
  }
};
