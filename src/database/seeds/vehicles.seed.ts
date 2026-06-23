import { DataSource, Like } from "typeorm";
import { Model } from "../../modules/models/entities/model.entity";
import { Vehicle } from "../../modules/vehicles/entities/vehicle.entity";

const VEHICLE_LICENSE_PREFIX = "AIV";
const VEHICLE_RENAVAM_BASE = 10000000000;
const VEHICLE_SEED_BATCH_SIZE = 250;

export async function seedVehicles(
  dataSource: DataSource,
  models: Model[],
  createdBy: number,
  quantity = 10000,
): Promise<number> {
  const repository = dataSource.getRepository(Vehicle);
  const existingSeedCount = await repository.count({
    where: {
      licensePlate: Like(`${VEHICLE_LICENSE_PREFIX}%`),
    },
  });

  if (existingSeedCount >= quantity) {
    return 0;
  }

  if (models.length === 0) {
    throw new Error("Vehicle seed requires at least one model.");
  }

  const vehicles: Vehicle[] = [];

  for (let i = existingSeedCount + 1; i <= quantity; i++) {
    const model = models[(i - 1) % models.length];

    vehicles.push(
      repository.create({
        licensePlate: `${VEHICLE_LICENSE_PREFIX}${String(i).padStart(4, "0")}`,
        chassis: `AIVCHASSIS${String(i).padStart(8, "0")}`,
        renavam: `${VEHICLE_RENAVAM_BASE + i}`,
        year: 2020 + ((i - 1) % 6),
        modelId: model.id,
        createdBy,
      }),
    );
  }

  if (vehicles.length > 0) {
    for (let i = 0; i < vehicles.length; i += VEHICLE_SEED_BATCH_SIZE) {
      await repository.save(vehicles.slice(i, i + VEHICLE_SEED_BATCH_SIZE));
    }
  }

  return vehicles.length;
}
