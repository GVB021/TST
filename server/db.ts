import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const rawDbUrl = process.env.DATABASE_URL;
const sslMode = (process.env.PGSSLMODE || "").toLowerCase();
const shouldUseSsl = sslMode === "disable"
  ? false
  : (process.env.DB_SSL === "false" ? false : true);

if (!rawDbUrl) {
  throw new Error("DATABASE_URL is required");
}

const connectionConfig: pg.PoolConfig = {
  connectionString: rawDbUrl,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
};

export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });
