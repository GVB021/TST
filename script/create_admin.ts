import "dotenv/config";
import { db } from "../server/db";
import { users } from "@shared/models/auth";
import { scryptSync, randomBytes } from "crypto";
import { eq } from "drizzle-orm";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const buf = scryptSync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  const email = "admin@vhub.com";
  const password = "admin";
  const hashedPassword = hashPassword(password);

  console.log(`Checking if user ${email} exists...`);
  
  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email));

    if (existingUser.length > 0) {
      console.log("Admin user already exists.");
      return;
    }

    console.log("Creating admin user...");
    await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      role: "platform_owner",
      status: "active",
      displayName: "Admin",
      fullName: "System Administrator",
    });

    console.log("Admin user created successfully.");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error creating admin user:", err);
  process.exit(1);
});
