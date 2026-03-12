import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ 
  host: "aws-1-us-east-2.pooler.supabase.com",
  port: 6543,
  user: "postgres.wsyjokgqbugohpahblfq",
  password: "hubdubsenhadadata",
  database: "postgres",
  ssl: {
    rejectUnauthorized: false
  }
});
export const db = drizzle(pool, { schema });
