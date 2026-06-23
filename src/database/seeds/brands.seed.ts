import { DataSource } from "typeorm";
import { Brand } from "../../modules/brands/entities/brand.entity";

const BRAND_NAMES = ["Volkswagen", "Fiat", "Toyota", "Chevrolet", "Ford"];

export async function seedBrands(
  dataSource: DataSource,
  createdBy: number,
): Promise<Brand[]> {
  const repository = dataSource.getRepository(Brand);
  const existingBrands = await repository.find();
  const brandsByName = new Map(existingBrands.map((brand) => [brand.name, brand]));

  const missingBrands = BRAND_NAMES.filter((name) => !brandsByName.has(name)).map(
    (name) =>
      repository.create({
        name,
        createdBy,
      }),
  );

  if (missingBrands.length > 0) {
    const savedBrands = await repository.save(missingBrands);

    for (const brand of savedBrands) {
      brandsByName.set(brand.name, brand);
    }
  }

  return BRAND_NAMES.map((name) => {
    const brand = brandsByName.get(name);

    if (!brand) {
      throw new Error(`Brand seed failed for "${name}".`);
    }

    return brand;
  });
}
