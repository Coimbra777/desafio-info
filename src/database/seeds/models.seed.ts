import { DataSource } from "typeorm";
import { Brand } from "../../modules/brands/entities/brand.entity";
import { Model } from "../../modules/models/entities/model.entity";

const MODEL_SEED_DATA = [
  { brandName: "Volkswagen", name: "Gol" },
  { brandName: "Volkswagen", name: "Polo" },
  { brandName: "Volkswagen", name: "T-Cross" },
  { brandName: "Fiat", name: "Argo" },
  { brandName: "Fiat", name: "Cronos" },
  { brandName: "Fiat", name: "Toro" },
  { brandName: "Toyota", name: "Corolla" },
  { brandName: "Toyota", name: "Hilux" },
  { brandName: "Toyota", name: "Yaris" },
  { brandName: "Chevrolet", name: "Onix" },
  { brandName: "Chevrolet", name: "Tracker" },
  { brandName: "Chevrolet", name: "S10" },
  { brandName: "Ford", name: "Ka" },
  { brandName: "Ford", name: "Ranger" },
  { brandName: "Ford", name: "Territory" },
];

export async function seedModels(
  dataSource: DataSource,
  brands: Brand[],
  createdBy: number,
): Promise<Model[]> {
  const repository = dataSource.getRepository(Model);
  const brandsByName = new Map(brands.map((brand) => [brand.name, brand]));
  const existingModels = await repository.find();
  const modelsByKey = new Map(
    existingModels.map((model) => [`${model.brandId}:${model.name}`, model]),
  );

  const missingModels = MODEL_SEED_DATA.filter(({ brandName, name }) => {
    const brand = brandsByName.get(brandName);

    if (!brand) {
      throw new Error(`Brand "${brandName}" was not seeded.`);
    }

    return !modelsByKey.has(`${brand.id}:${name}`);
  }).map(({ brandName, name }) => {
    const brand = brandsByName.get(brandName);

    if (!brand) {
      throw new Error(`Brand "${brandName}" was not seeded.`);
    }

    return repository.create({
      name,
      brandId: brand.id,
      createdBy,
    });
  });

  if (missingModels.length > 0) {
    const savedModels = await repository.save(missingModels);

    for (const model of savedModels) {
      modelsByKey.set(`${model.brandId}:${model.name}`, model);
    }
  }

  return MODEL_SEED_DATA.map(({ brandName, name }) => {
    const brand = brandsByName.get(brandName);

    if (!brand) {
      throw new Error(`Brand "${brandName}" was not seeded.`);
    }

    const model = modelsByKey.get(`${brand.id}:${name}`);

    if (!model) {
      throw new Error(`Model seed failed for "${brandName} ${name}".`);
    }

    return model;
  });
}
