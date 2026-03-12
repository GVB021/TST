import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // throw new Error("DATABASE_URL, ensure the database is provisioned");
  console.warn("DATABASE_URL not set. Using fallback hardcoded credentials.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL 
    ? { url: process.env.DATABASE_URL }
    : {
        host: "aws-1-us-east-2.pooler.supabase.com",
        port: 6543,
        user: "postgres.wsyjokgqbugohpahblfq",
        password: "hubdubsenhadadata",
        database: "postgres",
        ssl: true,
      },
});
