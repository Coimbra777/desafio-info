import "dotenv/config";
import dataSource from "../data-source";
import { ensureSeedUser } from "./users.seed";

function getRequiredEnv(
  name: "SEED_AIVACOL_EMAIL" | "SEED_AIVACOL_PASSWORD",
): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function runSeedUser(): Promise<void> {
  const seedEmail = getRequiredEnv("SEED_AIVACOL_EMAIL");
  const seedPassword = getRequiredEnv("SEED_AIVACOL_PASSWORD");

  await dataSource.initialize();

  try {
    const { created } = await ensureSeedUser(dataSource, {
      nickname: "aivacol",
      name: "Aivacol",
      email: seedEmail,
      password: seedPassword,
    });

    process.stdout.write(
      created
        ? 'Seed completed: user "aivacol" created.\n'
        : 'Seed skipped: user "aivacol" already exists.\n',
    );
  } finally {
    await dataSource.destroy();
  }
}

void runSeedUser();
