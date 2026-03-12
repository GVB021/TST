import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: "aws-1-us-east-2.pooler.supabase.com",
      port: 6543,
      user: "postgres.wsyjokgqbugohpahblfq",
      password: "hubdubsenhadadata",
      database: "postgres",
      ssl: {
        rejectUnauthorized: false
      }
    };

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Using fallback hardcoded credentials.");
}

export const pool = new Pool(connectionConfig);
export const db = drizzle(pool, { schema });
