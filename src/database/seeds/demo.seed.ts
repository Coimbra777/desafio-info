import "dotenv/config";
import * as bcrypt from "bcrypt";
import { Faker } from "@faker-js/faker";
import { Like } from "typeorm";
import dataSource from "../data-source";
import { Brand } from "../../modules/brands/entities/brand.entity";
import { Model } from "../../modules/models/entities/model.entity";
import { User } from "../../modules/users/entities/user.entity";
import { Vehicle } from "../../modules/vehicles/entities/vehicle.entity";
import {
  buildBrandData,
  buildModelData,
  buildUserData,
  buildVehicleData,
  createFaker,
} from "./fake/factories";

const DEFAULTS = { users: 20, brands: 8, modelsPerBrand: 4, vehicles: 120 };
const USER_BATCH_SIZE = 200;
const VEHICLE_BATCH_SIZE = 250;
const DEMO_NICKNAME_PREFIX = "demo-user-";
const DEMO_PLATE_PREFIX = "DEMO";

function parseQuantity(
  value: string | undefined,
  fallback: number,
  label: string,
): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid ${label}. Use a non-negative integer.`);
  }

  return parsed;
}

async function getCreatedByUserId(): Promise<number> {
  const user = await dataSource.getRepository(User).findOne({
    where: { nickname: "aivacol" },
  });

  if (!user) {
    throw new Error('User "aivacol" not found. Run the initial seed first.');
  }

  return user.id;
}

async function seedUsers(faker: Faker, quantity: number): Promise<number> {
  const repository = dataSource.getRepository(User);
  const existing = await repository.count({
    where: { nickname: Like(`${DEMO_NICKNAME_PREFIX}%`) },
  });

  if (existing >= quantity) {
    return 0;
  }

  const passwordHash = await bcrypt.hash("123456", 4);
  let created = 0;
  let batch: Array<Pick<User, "nickname" | "name" | "email" | "passwordHash">> =
    [];

  for (let index = 1; index <= quantity; index++) {
    const data = buildUserData(faker, index);

    // Avança o faker mesmo para índices já existentes, preservando o determinismo.
    if (index <= existing) {
      continue;
    }

    batch.push({ ...data, passwordHash });

    if (batch.length === USER_BATCH_SIZE) {
      await repository.insert(batch);
      created += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await repository.insert(batch);
    created += batch.length;
  }

  return created;
}

async function seedBrands(
  faker: Faker,
  quantity: number,
  createdBy: number,
): Promise<Brand[]> {
  const repository = dataSource.getRepository(Brand);
  const brands: Brand[] = [];

  for (let index = 1; index <= quantity; index++) {
    const data = buildBrandData(faker, index);
    const existing = await repository.findOne({ where: { name: data.name } });

    if (existing) {
      brands.push(existing);
      continue;
    }

    brands.push(
      await repository.save(repository.create({ ...data, createdBy })),
    );
  }

  return brands;
}

async function seedModels(
  faker: Faker,
  brands: Brand[],
  modelsPerBrand: number,
  createdBy: number,
): Promise<Model[]> {
  const repository = dataSource.getRepository(Model);
  const models: Model[] = [];

  for (const brand of brands) {
    const existingForBrand = await repository.find({
      where: { brandId: brand.id },
      order: { id: "ASC" },
    });
    const alreadyDemo = existingForBrand.length;

    for (let index = 1; index <= modelsPerBrand; index++) {
      const data = buildModelData(faker, brand.id, index);

      if (index <= alreadyDemo) {
        models.push(existingForBrand[index - 1]);
        continue;
      }

      models.push(
        await repository.save(repository.create({ ...data, createdBy })),
      );
    }
  }

  return models;
}

async function seedVehicles(
  faker: Faker,
  quantity: number,
  models: Model[],
  createdBy: number,
): Promise<number> {
  if (models.length === 0 || quantity === 0) {
    return 0;
  }

  const repository = dataSource.getRepository(Vehicle);
  const existing = await repository.count({
    where: { licensePlate: Like(`${DEMO_PLATE_PREFIX}%`) },
  });

  if (existing >= quantity) {
    return 0;
  }

  let created = 0;
  let batch: Array<
    Pick<
      Vehicle,
      "licensePlate" | "chassis" | "renavam" | "year" | "modelId" | "createdBy"
    >
  > = [];

  for (let index = 1; index <= quantity; index++) {
    // Round-robin entre os modelos para distribuir a frota.
    const model = models[(index - 1) % models.length];
    const data = buildVehicleData(faker, model.id, index);

    if (index <= existing) {
      continue;
    }

    batch.push({ ...data, createdBy });

    if (batch.length === VEHICLE_BATCH_SIZE) {
      await repository.insert(batch);
      created += batch.length;
      batch = [];
    }
  }

  if (batch.length > 0) {
    await repository.insert(batch);
    created += batch.length;
  }

  return created;
}

async function runDemoSeed(): Promise<void> {
  const users = parseQuantity(process.argv[2], DEFAULTS.users, "users quantity");
  const brands = parseQuantity(
    process.argv[3],
    DEFAULTS.brands,
    "brands quantity",
  );
  const modelsPerBrand = parseQuantity(
    process.argv[4],
    DEFAULTS.modelsPerBrand,
    "modelsPerBrand quantity",
  );
  const vehicles = parseQuantity(
    process.argv[5],
    DEFAULTS.vehicles,
    "vehicles quantity",
  );

  const seed = Number.parseInt(process.env.DEMO_SEED ?? "1337", 10);
  const faker = createFaker(seed);

  await dataSource.initialize();

  try {
    const createdBy = await getCreatedByUserId();
    const createdUsers = await seedUsers(faker, users);
    const brandEntities = await seedBrands(faker, brands, createdBy);
    const modelEntities = await seedModels(
      faker,
      brandEntities,
      modelsPerBrand,
      createdBy,
    );
    const createdVehicles = await seedVehicles(
      faker,
      vehicles,
      modelEntities,
      createdBy,
    );

    process.stdout.write(
      [
        `Demo seed (DEMO_SEED=${seed}):`,
        `  users created this run:    ${createdUsers}`,
        `  brands in use:             ${brandEntities.length}`,
        `  models in use:             ${modelEntities.length}`,
        `  vehicles created this run: ${createdVehicles}`,
      ].join("\n") + "\n",
    );
  } finally {
    await dataSource.destroy();
  }
}

void runDemoSeed();
