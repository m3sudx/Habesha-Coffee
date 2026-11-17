import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// An idle client can fail (for example if Postgres restarts); log it instead of crashing.
pool.on("error", (err) => {
  console.error("Unexpected Postgres pool error:", err);
});

export async function connectDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    console.log("Database connected");
  } finally {
    client.release();
  }
}