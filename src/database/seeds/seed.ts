import "dotenv/config";
import * as bcrypt from "bcrypt";
import dataSource from "../data-source";
import { User } from "../../modules/users/entities/user.entity";

function getRequiredEnv(
  name: "SEED_AIVACOL_EMAIL" | "SEED_AIVACOL_PASSWORD",
): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function runSeeds(): Promise<void> {
  const seedEmail = getRequiredEnv("SEED_AIVACOL_EMAIL");
  const seedPassword = getRequiredEnv("SEED_AIVACOL_PASSWORD");

  await dataSource.initialize();

  try {
    const userRepository = dataSource.getRepository(User);
    const existingUser = await userRepository.findOne({
      where: [{ nickname: "aivacol" }, { email: seedEmail }],
    });

    if (existingUser) {
      process.stdout.write('Seed skipped: user "aivacol" already exists.\n');
      return;
    }

    const passwordHash = await bcrypt.hash(seedPassword, 10);

    const user = userRepository.create({
      nickname: "aivacol",
      name: "Aivacol",
      email: seedEmail,
      passwordHash,
    });

    await userRepository.save(user);

    process.stdout.write('Seed completed: user "aivacol" created.\n');
  } finally {
    await dataSource.destroy();
  }
}

void runSeeds();
