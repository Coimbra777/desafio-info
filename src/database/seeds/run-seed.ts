import AppDataSource from "../data-source";
import { seedBrands } from "./brands.seed";
import { seedModels } from "./models.seed";
import { ensureSeedUser } from "./users.seed";
import { seedVehicles } from "./vehicles.seed";

async function bootstrap(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const { user, created } = await ensureSeedUser(AppDataSource, {
      email: process.env.SEED_AIVACOL_EMAIL,
      password: process.env.SEED_AIVACOL_PASSWORD,
    });
    const brands = await seedBrands(AppDataSource, user.id);
    const models = await seedModels(AppDataSource, brands, user.id);
    const createdVehicles = await seedVehicles(
      AppDataSource,
      models,
      user.id,
      10000,
    );

    process.stdout.write(
      [
        created
          ? 'Seed completed: user "aivacol" created.'
          : 'Seed skipped: user "aivacol" already exists.',
        `Brands available: ${brands.length}.`,
        `Models available: ${models.length}.`,
        `Vehicles created in this run: ${createdVehicles}.`,
      ].join("\n") + "\n",
    );
  } finally {
    await AppDataSource.destroy();
  }
}

void bootstrap();
