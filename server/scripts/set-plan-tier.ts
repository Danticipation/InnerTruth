import "dotenv/config";

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq } from "drizzle-orm";
import ws from "ws";

import { users } from "@shared/schema";

type PlanTier = "free" | "standard" | "premium";

type CliArgs = {
  userId?: string;
  email?: string;
  tier?: PlanTier;
  yes: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { yes: false };

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
      continue;
    }

    if (current === "--tier" && next && (next === "free" || next === "standard" || next === "premium")) {
      args.tier = next;
      i++;
      continue;
    }

    if (current === "--yes") {
      args.yes = true;
    }
  }

  return args;
}

function printUsage(): void {
  console.log("Usage:");
  console.log("  npm run plan:set -- --user-id <id> --tier <free|standard|premium> --yes");
  console.log("  npm run plan:set -- --email <email> --tier <free|standard|premium> --yes");
}

async function main() {
  const { userId, email, tier, yes } = parseArgs(process.argv.slice(2));
  const targetCount = Number(Boolean(userId)) + Number(Boolean(email));

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  if (targetCount !== 1 || !tier || !yes) {
    printUsage();
    throw new Error("Invalid arguments. Provide exactly one target (--user-id or --email), --tier, and --yes.");
  }

  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    const existing = userId
      ? await db
          .select({ id: users.id, email: users.email, planTier: users.planTier })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
      : await db
          .select({ id: users.id, email: users.email, planTier: users.planTier })
          .from(users)
          .where(eq(users.email, email!))
          .limit(1);

    const user = existing[0];
    if (!user) {
      throw new Error("User not found for provided selector.");
    }

    const updated = await db
      .update(users)
      .set({ planTier: tier, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning({ id: users.id, email: users.email, planTier: users.planTier });

    const row = updated[0];
    console.log(
      `Updated user ${row.id} (${row.email ?? "no-email"}) plan tier: ${user.planTier} -> ${row.planTier}`
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("[plan:set] Failed:", error.message);
  process.exit(1);
});
