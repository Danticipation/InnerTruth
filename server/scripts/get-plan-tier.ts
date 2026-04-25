import "dotenv/config";

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import ws from "ws";

import { users } from "@shared/schema";

type CliArgs = {
  userId?: string;
  email?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};

  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    const next = argv[i + 1];

    if (current === "--user-id" && next) {
      args.userId = next;
      i++;
      continue;
    }

    if (current === "--email" && next) {
      args.email = next;
      i++;
    }
  }

  return args;
}

function printUsage(): void {
  console.log("Usage:");
  console.log("  npm run plan:get -- --user-id <id>");
  console.log("  npm run plan:get -- --email <email>");
}

async function main() {
  const { userId, email } = parseArgs(process.argv.slice(2));
  const targetCount = Number(Boolean(userId)) + Number(Boolean(email));

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  if (targetCount !== 1) {
    printUsage();
    throw new Error("Provide exactly one selector: --user-id or --email.");
  }

  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    const rows = userId
      ? await db
          .select({
            id: users.id,
            email: users.email,
            planTier: users.planTier,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
      : await db
          .select({
            id: users.id,
            email: users.email,
            planTier: users.planTier,
            updatedAt: users.updatedAt,
          })
          .from(users)
          .where(eq(users.email, email!))
          .limit(1);

    const user = rows[0];
    if (!user) {
      throw new Error("User not found for provided selector.");
    }

    console.log(JSON.stringify(user, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[plan:get] Failed:", error.message);
  process.exit(1);
});
