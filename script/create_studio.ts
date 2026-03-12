import "dotenv/config";
import { db } from "../server/db";
import { users, studios, studioMemberships } from "../shared/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const adminEmail = "admin@vhub.com";
  
  console.log(`Searching for user ${adminEmail}...`);
  const [user] = await db.select().from(users).where(eq(users.email, adminEmail));

  if (!user) {
    console.error(`User ${adminEmail} not found. Please run create_admin.ts first.`);
    process.exit(1);
  }

  console.log(`User found: ${user.id} (${user.displayName || user.email})`);

  const studioSlug = "vhub-dub-studio";
  const [existingStudio] = await db.select().from(studios).where(eq(studios.slug, studioSlug));

  let studioId: string;

  if (existingStudio) {
    console.log(`Studio with slug '${studioSlug}' already exists (ID: ${existingStudio.id}).`);
    studioId = existingStudio.id;
  } else {
    console.log(`Creating studio '${studioSlug}'...`);
    const [newStudio] = await db.insert(studios).values({
      name: "VHUB Dub Studio",
      slug: studioSlug,
      tradeName: "VHUB",
      ownerId: user.id,
      description: "O melhor estúdio de dublagem virtual.",
      isActive: true,
      country: "Brasil",
    }).returning();
    
    studioId = newStudio.id;
    console.log(`Studio created: ${newStudio.id}`);
  }

  // Check membership
  const [existingMembership] = await db.select().from(studioMemberships).where(
    and(
      eq(studioMemberships.userId, user.id),
      eq(studioMemberships.studioId, studioId)
    )
  );

  if (existingMembership) {
    console.log("User is already a member of this studio.");
  } else {
    console.log("Adding user to studio membership...");
    await db.insert(studioMemberships).values({
      userId: user.id,
      studioId: studioId,
      role: "owner",
      status: "active",
    });
    console.log("Membership created successfully.");
  }

  console.log("Studio setup complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error creating studio:", err);
  process.exit(1);
});