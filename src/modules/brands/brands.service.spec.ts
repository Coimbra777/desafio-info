import { ConflictException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Model } from "../models/entities/model.entity";
import { Brand } from "./entities/brand.entity";
import { BrandsService } from "./brands.service";

describe("BrandsService", () => {
  let brandsService: BrandsService;
  let brandsRepository: jest.Mocked<
    Pick<Repository<Brand>, "create" | "findOne" | "save" | "remove">
  >;
  let modelsRepository: jest.Mocked<Pick<Repository<Model>, "count">>;

  beforeEach(() => {
    brandsRepository = {
      create: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    modelsRepository = {
      count: jest.fn(),
    };

    brandsService = new BrandsService(
      brandsRepository as unknown as Repository<Brand>,
      modelsRepository as unknown as Repository<Model>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a brand with createdBy", async () => {
    const createdBrand = createBrand();

    brandsRepository.findOne.mockResolvedValue(null);
    brandsRepository.create.mockReturnValue(createdBrand);
    brandsRepository.save.mockResolvedValue(createdBrand);

    const result = await brandsService.create({ name: "Toyota" }, 1);

    expect(brandsRepository.create).toHaveBeenCalledWith({
      name: "Toyota",
      createdBy: 1,
    });
    expect(brandsRepository.save).toHaveBeenCalledWith(createdBrand);
    expect(result).toEqual(createdBrand);
  });

  it("throws ConflictException on create when name already exists", async () => {
    brandsRepository.findOne.mockResolvedValue(createBrand());

    await expect(
      brandsService.create({ name: "Toyota" }, 1),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(brandsRepository.create).not.toHaveBeenCalled();
    expect(brandsRepository.save).not.toHaveBeenCalled();
  });

  it("returns an existing brand on findOne", async () => {
    const brand = createBrand();

    brandsRepository.findOne.mockResolvedValue(brand);

    const result = await brandsService.findOne(brand.id);

    expect(result).toEqual(brand);
    expect(brandsRepository.findOne).toHaveBeenCalledWith({
      where: { id: brand.id },
    });
  });

  it("throws NotFoundException on findOne when brand does not exist", async () => {
    brandsRepository.findOne.mockResolvedValue(null);

    await expect(brandsService.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("updates an existing brand", async () => {
    const existingBrand = createBrand();
    const updatedBrand = {
      ...existingBrand,
      name: "Honda",
    };

    brandsRepository.findOne
      .mockResolvedValueOnce(existingBrand)
      .mockResolvedValueOnce(null);
    brandsRepository.save.mockResolvedValue(updatedBrand);

    const result = await brandsService.update(existingBrand.id, {
      name: "Honda",
    });

    expect(brandsRepository.save).toHaveBeenCalledWith({
      ...existingBrand,
      name: "Honda",
    });
    expect(result).toEqual(updatedBrand);
  });

  it("throws ConflictException on update when name already exists", async () => {
    const existingBrand = createBrand();

    brandsRepository.findOne
      .mockResolvedValueOnce(existingBrand)
      .mockResolvedValueOnce(createBrand(2, "Honda"));

    await expect(
      brandsService.update(existingBrand.id, { name: "Honda" }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(brandsRepository.save).not.toHaveBeenCalled();
  });

  it("removes a brand when there are no linked models", async () => {
    const brand = createBrand();

    brandsRepository.findOne.mockResolvedValue(brand);
    modelsRepository.count.mockResolvedValue(0);
    brandsRepository.remove.mockResolvedValue(brand);

    await brandsService.remove(brand.id);

    expect(modelsRepository.count).toHaveBeenCalledWith({
      where: { brandId: brand.id },
    });
    expect(brandsRepository.remove).toHaveBeenCalledWith(brand);
  });

  it("throws ConflictException on remove when there are linked models", async () => {
    const brand = createBrand();

    brandsRepository.findOne.mockResolvedValue(brand);
    modelsRepository.count.mockResolvedValue(2);

    await expect(brandsService.remove(brand.id)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(brandsRepository.remove).not.toHaveBeenCalled();
  });

  it("throws NotFoundException on remove when brand does not exist", async () => {
    brandsRepository.findOne.mockResolvedValue(null);

    await expect(brandsService.remove(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(modelsRepository.count).not.toHaveBeenCalled();
    expect(brandsRepository.remove).not.toHaveBeenCalled();
  });
});

function createBrand(id = 1, name = "Toyota"): Brand {
  return {
    id,
    name,
    createdBy: 1,
    creator: undefined as never,
    models: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
