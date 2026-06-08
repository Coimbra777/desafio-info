import "dotenv/config";
import * as bcrypt from "bcrypt";
import { validateSeedEnv } from "../../config/validation.config";
import dataSource from "../data-source";
import { User } from "../../modules/users/entities/user.entity";

async function runSeeds(): Promise<void> {
  validateSeedEnv(process.env);

  await dataSource.initialize();

  try {
    const userRepository = dataSource.getRepository(User);
    const existingUser = await userRepository.findOne({
      where: [
        { nickname: 'aivacol' },
        { email: process.env.SEED_AIVACOL_EMAIL as string },
      ],
    });

    if (existingUser) {
      process.stdout.write('Seed skipped: user "aivacol" already exists.\n');
      return;
    }

    const passwordHash = await bcrypt.hash(
      process.env.SEED_AIVACOL_PASSWORD as string,
      10,
    );

    const user = userRepository.create({
      nickname: "aivacol",
      name: "Aivacol",
      email: process.env.SEED_AIVACOL_EMAIL as string,
      passwordHash,
    });

    await userRepository.save(user);

    process.stdout.write('Seed completed: user "aivacol" created.\n');
  } finally {
    await dataSource.destroy();
  }
}

void runSeeds();
